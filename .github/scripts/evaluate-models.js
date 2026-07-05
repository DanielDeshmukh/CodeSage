const https = require('https');
const fs = require('fs');
const path = require('path');

// NIM API configuration
const NIM_API_KEY = process.env.NIM_API_KEY;
const NIM_BASE_URL = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

// Model task definitions with strict filtering rules
const MODEL_TASKS = {
  embedding: {
    name: 'embedding',
    description: 'Code embedding for semantic search',
    // Only accept embedding models
    filter: (model) => {
      const id = model.id.toLowerCase();
      return id.includes('embed') && !id.includes('rerank');
    },
    // Preferred embedding models (in order)
    preferred: [
      'nvidia/nv-embedqa-e5-v5',
      'nvidia/nv-embedcode-7b-v1',
      'nvidia/llama-nemotron-embed-1b-v2',
      'nvidia/nv-embedqa-mistral-7b-v2',
    ],
    // Must have these capabilities
    requiredCapabilities: ['embedding'],
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
    // Only accept reranker models
    filter: (model) => {
      const id = model.id.toLowerCase();
      return id.includes('rerank');
    },
    preferred: [
      'nvidia/nv-rerankqa-mistral-4b-v3',
      'nvidia/llama-nemotron-rerank-1b-v2',
    ],
    requiredCapabilities: ['reranking'],
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
    // Only accept chat/instruct models (NOT embedding, NOT safety)
    filter: (model) => {
      const id = model.id.toLowerCase();
      // Must be a chat/instruct model
      const isChat = id.includes('chat') || id.includes('instruct') || id.includes('super') || id.includes('ultra');
      // Must NOT be embedding, reranker, or safety
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
    ],
    requiredCapabilities: ['chat', 'code'],
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
    // Must be different from examiner - prefer instruct/reward models
    filter: (model) => {
      const id = model.id.toLowerCase();
      // Must be a chat/instruct model
      const isChat = id.includes('chat') || id.includes('instruct') || id.includes('super') || id.includes('ultra');
      // Must NOT be embedding, reranker, or safety
      const notEmbed = !id.includes('embed');
      const notRerank = !id.includes('rerank');
      const notSafety = !id.includes('safety') && !id.includes('guard');
      // Prefer reward/instruct models
      const isReward = id.includes('reward') || id.includes('instruct');
      return isChat && notEmbed && notRerank && notSafety && isReward;
    },
    preferred: [
      'nvidia/nemotron-4-340b-reward',
      'nvidia/nemotron-4-340b-instruct',
      'nvidia/llama-3.1-nemotron-70b-instruct',
      'nvidia/llama-3.3-nemotron-super-49b-v1',
    ],
    requiredCapabilities: ['chat', 'reasoning'],
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
    // Only accept safety/guard models
    filter: (model) => {
      const id = model.id.toLowerCase();
      return id.includes('safety') || id.includes('guard') || id.includes('nemoguard');
    },
    preferred: [
      'nvidia/nemotron-3.5-content-safety',
      'nvidia/llama-3.1-nemoguard-8b-content-safety',
      'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
      'nvidia/nemotron-3-content-safety',
    ],
    requiredCapabilities: ['safety'],
    testEndpoint: '/v1/chat/completions',
    testPayload: (modelId) => ({
      model: modelId,
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      max_tokens: 50,
    }),
  },
};

// Helper to make NIM API requests
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Fetch all available models from NIM
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

// Fallback models (known working on NIM free tier)
const FALLBACK_MODELS = {
  embedding: 'nvidia/nv-embedqa-e5-v5',
  reranker: '', // No reranker available
  examiner: 'nvidia/llama-3.3-nemotron-super-49b-v1',
  scorer: 'nvidia/llama-3.3-nemotron-super-49b-v1',
  safety: 'nvidia/nemotron-3.5-content-safety',
};

// Test if a model works for a specific task
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
      success: !response.error,
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

// Evaluate a model for a specific task
async function evaluateModel(model, task, usedModels) {
  const taskConfig = MODEL_TASKS[task];
  const modelId = model.id;
  
  // Skip if model already used for another task
  if (usedModels.has(modelId)) {
    return null;
  }

  // Apply task-specific filter
  if (!taskConfig.filter(model)) {
    return null;
  }

  console.log(`  Testing ${modelId}...`);
  
  // Test if model works
  const testResult = await testModel(modelId, task);
  
  if (!testResult.success) {
    console.log(`    Failed: ${testResult.error}`);
    return null;
  }

  // Calculate score
  let score = 50; // Base score for working model
  
  // Bonus for preferred models
  if (taskConfig.preferred.includes(modelId)) {
    score += 30;
  }
  
  // Bonus for NVIDIA models
  if (modelId.startsWith('nvidia/')) {
    score += 10;
  }
  
  // Penalty for slow models
  if (testResult.latencyMs > 3000) {
    score -= 10;
  } else if (testResult.latencyMs < 1000) {
    score += 5;
  }

  return {
    modelId,
    displayName: model.name || modelId,
    task,
    score,
    latencyMs: testResult.latencyMs,
    isPreferred: taskConfig.preferred.includes(modelId),
  };
}

// Main evaluation function
async function evaluateModels() {
  console.log('Starting NIM model evaluation...\n');

  // Fetch available models
  const models = await fetchAvailableModels();
  
  if (models.length === 0) {
    console.error('No models available from NIM API');
    process.exit(1);
  }

  console.log(`Found ${models.length} available models\n`);

  const results = {};
  const usedModels = new Set(); // Track used models to avoid duplicates
  
  // Evaluate each task in priority order
  const taskPriority = ['embedding', 'safety', 'examiner', 'scorer', 'reranker'];
  
  for (const task of taskPriority) {
    const taskConfig = MODEL_TASKS[task];
    console.log(`\nEvaluating models for: ${taskConfig.description}`);
    console.log('='.repeat(50));

    const evaluations = [];

    for (const model of models) {
      const evaluation = await evaluateModel(model, task, usedModels);
      if (evaluation) {
        evaluations.push(evaluation);
      }
    }

    // Sort by score (preferred models first)
    evaluations.sort((a, b) => {
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      return b.score - a.score;
    });
    
    const bestModel = evaluations[0];
    
    if (bestModel) {
      console.log(`\nBest model for ${task}:`);
      console.log(`  ID: ${bestModel.modelId}`);
      console.log(`  Score: ${bestModel.score}/100`);
      console.log(`  Latency: ${bestModel.latencyMs}ms`);
      
      // Mark model as used
      usedModels.add(bestModel.modelId);
      
      results[task] = {
        selected: bestModel,
        alternatives: evaluations.slice(1, 3).map(e => ({
          modelId: e.modelId,
          score: e.score,
          latencyMs: e.latencyMs,
        })),
      };
    } else {
      // Use fallback model if available
      const fallbackId = FALLBACK_MODELS[task];
      if (fallbackId && !usedModels.has(fallbackId)) {
        console.log(`\nUsing fallback model for ${task}: ${fallbackId}`);
        usedModels.add(fallbackId);
        results[task] = {
          selected: {
            modelId: fallbackId,
            displayName: fallbackId,
            task,
            score: 50,
            latencyMs: 0,
            isPreferred: true,
            isFallback: true,
          },
          alternatives: [],
        };
      } else {
        console.log(`\nNo suitable model found for ${task}`);
        results[task] = { selected: null, alternatives: [] };
      }
    }
  }

  return results;
}

// Save results
function saveResults(results) {
  const outputDir = path.join(__dirname, '..', 'model-evaluations');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(outputDir, `evaluation-${timestamp}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${filename}`);

  // Save summary
  const summary = Object.entries(results).map(([task, data]) => ({
    task,
    selectedModel: data.selected?.modelId || 'None',
    score: data.selected?.score || 0,
    latencyMs: data.selected?.latencyMs || 0,
    alternatives: data.alternatives?.map(a => a.modelId) || [],
  }));

  const summaryFile = path.join(outputDir, 'latest-evaluation.json');
  fs.writeFileSync(summaryFile, JSON.stringify({ 
    timestamp: new Date().toISOString(), 
    results: summary 
  }, null, 2));
  
  return summary;
}

// Run if executed directly
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
        if (item.alternatives.length > 0) {
          console.log(`  Alternatives: ${item.alternatives.join(', ')}`);
        }
      });
      
      // Verify no duplicates
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
