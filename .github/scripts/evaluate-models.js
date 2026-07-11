const https = require('https');
const fs = require('fs');
const path = require('path');

const NIM_API_KEY = process.env.NIM_API_KEY;
const NIM_BASE_URL = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

// Task definitions with strict filtering
const MODEL_TASKS = {
  embedding: {
    name: 'embedding',
    description: 'Code embedding for semantic search',
    filter: (model) => {
      const id = model.id.toLowerCase();
      return id.includes('embed') && !id.includes('rerank');
    },
    preferred: [
      'nvidia/nv-embedqa-e5-v5',
      'nvidia/nv-embedcode-7b-v1',
      'nvidia/llama-nemotron-embed-1b-v2',
      'nvidia/nv-embedqa-mistral-7b-v2',
      'nvidia/embed-qa-4',
      'nvidia/nv-embed-v1',
      'snowflake/arctic-embed-l',
    ],
    testEndpoint: '/v1/embeddings',
    testPayload: (modelId) => ({
      input: 'function hello() { return "world"; }',
      model: modelId,
      input_type: 'passage',
    }),
  },
  reranker: {
    name: 'reranker',
    description: 'Code relevance reranking',
    filter: (model) => {
      const id = model.id.toLowerCase();
      return id.includes('rerank');
    },
    preferred: [
      'nvidia/nv-rerankqa-mistral-4b-v3',
      'nvidia/llama-nemotron-rerank-1b-v2',
    ],
    testEndpoint: '/v1/ranking',
    testPayload: (modelId) => ({
      model: modelId,
      query: { text: 'How to implement a binary search?' },
      passages: [
        { text: 'function binarySearch(arr, target) { ... }' },
        { text: 'This is about cooking recipes.' },
      ],
    }),
  },
  examiner: {
    name: 'examiner',
    description: 'Question generation and code analysis',
    filter: (model) => {
      const id = model.id.toLowerCase();
      const isChat = id.includes('chat') || id.includes('instruct') || id.includes('super') || id.includes('ultra');
      const notEmbed = !id.includes('embed');
      const notRerank = !id.includes('rerank');
      const notSafety = !id.includes('safety') && !id.includes('guard');
      const notReward = !id.includes('reward');
      return isChat && notEmbed && notRerank && notSafety && notReward;
    },
    preferred: [
      'nvidia/llama-3.3-nemotron-super-49b-v1',
      'nvidia/llama-3.1-nemotron-70b-instruct',
      'nvidia/llama-3.3-nemotron-super-49b-v1.5',
      'nvidia/nemotron-4-340b-instruct',
      'nvidia/llama-3.1-nemotron-51b-instruct',
      'nvidia/nemotron-3-super-120b-a12b',
      'meta/llama-3.3-70b-instruct',
      'meta/llama-3.1-70b-instruct',
      'ibm/granite-34b-code-instruct',
      'deepseek-ai/deepseek-coder-6.7b-instruct',
    ],
    testEndpoint: '/v1/chat/completions',
    testPayload: (modelId) => ({
      model: modelId,
      messages: [{ role: 'user', content: 'Explain this code: function add(a,b) { return a+b; }' }],
      max_tokens: 50,
    }),
  },
  scorer: {
    name: 'scorer',
    description: 'Answer evaluation and scoring',
    filter: (model) => {
      const id = model.id.toLowerCase();
      const isChat = id.includes('chat') || id.includes('instruct') || id.includes('super') || id.includes('ultra') || id.includes('reward');
      const notEmbed = !id.includes('embed');
      const notRerank = !id.includes('rerank');
      const notSafety = !id.includes('safety') && !id.includes('guard');
      return isChat && notEmbed && notRerank && notSafety;
    },
    preferred: [
      'nvidia/nemotron-4-340b-reward',
      'nvidia/nemotron-4-340b-instruct',
      'nvidia/llama-3.1-nemotron-70b-instruct',
      'nvidia/llama-3.3-nemotron-super-49b-v1',
      'nvidia/llama-3.1-nemotron-51b-instruct',
      'nvidia/nemotron-3-super-120b-a12b',
      'meta/llama-3.3-70b-instruct',
      'ibm/granite-34b-code-instruct',
    ],
    testEndpoint: '/v1/chat/completions',
    testPayload: (modelId) => ({
      model: modelId,
      messages: [{ role: 'user', content: 'Evaluate this answer: The function adds two numbers.' }],
      max_tokens: 50,
    }),
  },
  safety: {
    name: 'safety',
    description: 'Content safety filtering',
    filter: (model) => {
      const id = model.id.toLowerCase();
      return id.includes('safety') || id.includes('guard') || id.includes('nemoguard');
    },
    preferred: [
      'nvidia/nemotron-3.5-content-safety',
      'nvidia/llama-3.1-nemoguard-8b-content-safety',
      'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
      'nvidia/nemotron-3-content-safety',
      'nvidia/nemotron-content-safety-reasoning-4b',
      'meta/llama-guard-4-12b',
    ],
    testEndpoint: '/v1/chat/completions',
    testPayload: (modelId) => ({
      model: modelId,
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      max_tokens: 50,
    }),
  },
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${NIM_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function fetchAvailableModels() {
  console.log('Fetching available models from NIM API...');
  try {
    const response = await makeRequest(`${NIM_BASE_URL}/models`);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch models:', error.message);
    return [];
  }
}

async function testModel(modelId, task) {
  const taskConfig = MODEL_TASKS[task];
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${NIM_BASE_URL}${taskConfig.testEndpoint}`, {
      method: 'POST',
      body: taskConfig.testPayload(modelId),
    });

    const latencyMs = Date.now() - startTime;
    
    return {
      success: !response.error && (response.data || response.choices || response.results),
      latencyMs,
      error: response.error?.message || null,
    };
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function evaluateModels() {
  console.log('Starting comprehensive NIM model evaluation...\n');

  const models = await fetchAvailableModels();
  
  if (models.length === 0) {
    console.error('No models available from NIM API');
    process.exit(1);
  }

  console.log(`Found ${models.length} available models\n`);

  const results = {};
  const usedModels = new Set();
  
  // Test each task
  for (const [task, taskConfig] of Object.entries(MODEL_TASKS)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Evaluating: ${taskConfig.description}`);
    console.log(`${'='.repeat(60)}`);

    const evaluations = [];
    const testModels = models.filter(taskConfig.filter);
    
    console.log(`Found ${testModels.length} candidate models`);

    for (const model of testModels) {
      if (usedModels.has(model.id)) {
        continue;
      }

      console.log(`  Testing ${model.id}...`);
      
      const testResult = await testModel(model.id, task);
      
      if (testResult.success) {
        console.log(`    ✅ WORKS (${testResult.latencyMs}ms)`);
        
        let score = 50;
        if (taskConfig.preferred.includes(model.id)) score += 30;
        if (model.id.startsWith('nvidia/')) score += 10;
        if (testResult.latencyMs < 2000) score += 10;
        
        evaluations.push({
          modelId: model.id,
          score,
          latencyMs: testResult.latencyMs,
          isPreferred: taskConfig.preferred.includes(model.id),
        });
      } else {
        console.log(`    ❌ FAILED: ${testResult.error}`);
      }
    }

    // Sort by score (preferred first)
    evaluations.sort((a, b) => {
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      return b.score - a.score;
    });
    
    const bestModel = evaluations[0];
    
    if (bestModel) {
      console.log(`\n🏆 Best model for ${task}: ${bestModel.modelId}`);
      console.log(`   Score: ${bestModel.score}/100, Latency: ${bestModel.latencyMs}ms`);
      
      usedModels.add(bestModel.modelId);
      
      results[task] = {
        selected: bestModel,
        alternatives: evaluations.slice(1, 3),
        totalTested: testModels.length,
        totalWorking: evaluations.length,
      };
    } else {
      console.log(`\n⚠️  No working model found for ${task}`);
      results[task] = { selected: null, alternatives: [], totalTested: testModels.length, totalWorking: 0 };
    }
  }

  return results;
}

function saveResults(results) {
  const outputDir = path.join(__dirname, '..', 'model-evaluations');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(outputDir, `evaluation-${timestamp}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  // Save summary
  const summary = Object.entries(results).map(([task, data]) => ({
    task,
    selectedModel: data.selected?.modelId || 'None',
    score: data.selected?.score || 0,
    latencyMs: data.selected?.latencyMs || 0,
    alternatives: data.alternatives?.map(a => a.modelId) || [],
    totalTested: data.totalTested || 0,
    totalWorking: data.totalWorking || 0,
  }));

  const summaryFile = path.join(outputDir, 'latest-evaluation.json');
  fs.writeFileSync(summaryFile, JSON.stringify({ 
    timestamp: new Date().toISOString(), 
    results: summary 
  }, null, 2));
  
  return summary;
}

if (require.main === module) {
  evaluateModels()
    .then(results => {
      const summary = saveResults(results);
      
      console.log('\n' + '='.repeat(60));
      console.log('EVALUATION SUMMARY');
      console.log('='.repeat(60));
      
      summary.forEach(item => {
        console.log(`\n${item.task.toUpperCase()}:`);
        console.log(`  Selected: ${item.selectedModel}`);
        console.log(`  Score: ${item.score}/100`);
        console.log(`  Latency: ${item.latencyMs}ms`);
        console.log(`  Tested: ${item.totalTested} models, ${item.totalWorking} working`);
        if (item.alternatives.length > 0) {
          console.log(`  Alternatives: ${item.alternatives.join(', ')}`);
        }
      });
      
      // Verify uniqueness
      const selectedModels = summary.map(s => s.selectedModel).filter(m => m !== 'None');
      const uniqueModels = new Set(selectedModels);
      
      if (selectedModels.length !== uniqueModels.size) {
        console.error('\n❌ ERROR: Duplicate models detected!');
        process.exit(1);
      }
      
      console.log('\n✅ All tasks have unique models');
      process.exit(0);
    })
    .catch(error => {
      console.error('Evaluation failed:', error);
      process.exit(1);
    });
}

module.exports = { evaluateModels, saveResults };
