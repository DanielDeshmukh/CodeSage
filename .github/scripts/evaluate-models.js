const https = require('https');
const fs = require('fs');
const path = require('path');

// NIM API configuration
const NIM_API_KEY = process.env.NIM_API_KEY;
const NIM_BASE_URL = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

// Model task definitions
const MODEL_TASKS = {
  embedding: {
    name: 'embedding',
    description: 'Code embedding for semantic search',
    requiredCapabilities: ['embedding', 'code'],
    preferredDimensions: [384, 512, 768, 1024],
    maxLatencyMs: 1000,
  },
  reranker: {
    name: 'reranker',
    description: 'Code relevance reranking',
    requiredCapabilities: ['reranking', 'code'],
    maxLatencyMs: 500,
  },
  examiner: {
    name: 'examiner',
    description: 'Question generation and code analysis',
    requiredCapabilities: ['chat', 'code', 'reasoning'],
    minParameters: '7B',
    maxLatencyMs: 5000,
  },
  scorer: {
    name: 'scorer',
    description: 'Answer evaluation and scoring',
    requiredCapabilities: ['chat', 'code', 'reasoning'],
    minParameters: '7B',
    maxLatencyMs: 5000,
  },
  safety: {
    name: 'safety',
    description: 'Content safety filtering',
    requiredCapabilities: ['safety', 'classification'],
    maxLatencyMs: 2000,
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

// Evaluate a model for a specific task
async function evaluateModelForTask(model, task) {
  const evaluation = {
    modelId: model.id,
    displayName: model.name || model.id,
    task: task.name,
    score: 0,
    capabilities: [],
    metrics: {},
    timestamp: new Date().toISOString(),
  };

  // Extract model info
  const modelInfo = {
    id: model.id,
    name: model.name || model.id,
    description: model.description || '',
    owner: model.owner || '',
    version: model.version || 'latest',
    created: model.created || Date.now(),
  };

  // Score based on capabilities
  let capabilityScore = 0;
  
  // Check if model has required capabilities
  const hasCapability = (cap) => {
    const desc = (modelInfo.description + modelInfo.name).toLowerCase();
    return desc.includes(cap.toLowerCase());
  };

  for (const cap of task.requiredCapabilities) {
    if (hasCapability(cap)) {
      capabilityScore += 20;
      evaluation.capabilities.push(cap);
    }
  }

  // Bonus for code-specific models
  if (hasCapability('code') || hasCapability('programming')) {
    capabilityScore += 10;
  }

  // Bonus for NVIDIA models (typically better NIM integration)
  if (modelInfo.owner === 'nvidia' || modelInfo.id.startsWith('nvidia/')) {
    capabilityScore += 15;
  }

  // Penalty for deprecated models
  if (modelInfo.description.toLowerCase().includes('deprecated')) {
    capabilityScore -= 30;
  }

  // Calculate final score (0-100)
  evaluation.score = Math.min(100, Math.max(0, capabilityScore));
  evaluation.metrics = {
    hasRequiredCapabilities: capabilityScore >= 100,
    modelAge: Date.now() - modelInfo.created,
    capabilityMatch: evaluation.capabilities.length / task.requiredCapabilities.length,
  };

  return evaluation;
}

// Test model latency and quality
async function testModelPerformance(modelId, taskName) {
  const startTime = Date.now();
  
  try {
    let testPayload;
    
    switch (taskName) {
      case 'embedding':
        testPayload = {
          input: 'function hello() { return "world"; }',
          model: modelId,
          input_type: 'passage',
        };
        break;
      case 'reranker':
        testPayload = {
          model: modelId,
          query: 'How to implement a binary search?',
          passages: [
            { text: 'function binarySearch(arr, target) { ... }' },
            { text: 'This is about cooking recipes.' },
          ],
        };
        break;
      case 'examiner':
      case 'scorer':
        testPayload = {
          model: modelId,
          messages: [
            { role: 'user', content: 'Explain this code: function add(a,b) { return a+b; }' },
          ],
          max_tokens: 100,
        };
        break;
      case 'safety':
        testPayload = {
          model: modelId,
          messages: [
            { role: 'user', content: 'Hello, how are you?' },
          ],
        };
        break;
      default:
        return { latencyMs: 0, success: false, error: 'Unknown task' };
    }

    const endpoint = taskName === 'embedding' ? '/embeddings' :
                    taskName === 'reranker' ? '/ranking' : '/chat/completions';
    
    const response = await makeRequest(`${NIM_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: testPayload,
    });

    const latencyMs = Date.now() - startTime;
    
    return {
      latencyMs,
      success: !response.error,
      tokensPerSecond: taskName === 'examiner' || taskName === 'scorer' 
        ? (response.usage?.completion_tokens || 0) / (latencyMs / 1000)
        : undefined,
      error: response.error?.message || null,
    };
  } catch (error) {
    return {
      latencyMs: Date.now() - startTime,
      success: false,
      error: error.message,
    };
  }
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
  
  // Evaluate each task
  for (const [taskName, taskConfig] of Object.entries(MODEL_TASKS)) {
    console.log(`\nEvaluating models for: ${taskConfig.description}`);
    console.log('='.repeat(50));

    const evaluations = [];

    for (const model of models) {
      // Skip obviously wrong models
      const modelId = model.id.toLowerCase();
      const isRelevant = taskConfig.requiredCapabilities.some(cap => 
        modelId.includes(cap.toLowerCase()) ||
        (model.name && model.name.toLowerCase().includes(cap.toLowerCase()))
      );

      if (!isRelevant) {
        continue;
      }

      // Evaluate model
      const evaluation = await evaluateModelForTask(model, taskConfig);
      
      // Test performance if model looks promising
      if (evaluation.score >= 50) {
        console.log(`  Testing ${model.id}...`);
        const performance = await testModelPerformance(model.id, taskName);
        evaluation.metrics.performance = performance;
        
        // Adjust score based on performance
        if (performance.success) {
          evaluation.score += 10;
          if (performance.latencyMs < taskConfig.maxLatencyMs) {
            evaluation.score += 5;
          }
        } else {
          evaluation.score -= 20;
        }
      }

      evaluations.push(evaluation);
    }

    // Sort by score and pick the best
    evaluations.sort((a, b) => b.score - a.score);
    
    const bestModel = evaluations[0];
    
    if (bestModel) {
      console.log(`\nBest model for ${taskName}:`);
      console.log(`  ID: ${bestModel.modelId}`);
      console.log(`  Score: ${bestModel.score}/100`);
      console.log(`  Capabilities: ${bestModel.capabilities.join(', ')}`);
      
      results[taskName] = {
        selected: bestModel,
        alternatives: evaluations.slice(1, 3),
        allEvaluations: evaluations,
      };
    } else {
      console.log(`\nNo suitable model found for ${taskName}`);
      results[taskName] = { selected: null, alternatives: [], allEvaluations: [] };
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

  // Also save a summary for easy reading
  const summary = Object.entries(results).map(([task, data]) => ({
    task,
    selectedModel: data.selected?.modelId || 'None',
    score: data.selected?.score || 0,
    alternatives: data.alternatives?.map(a => a.modelId) || [],
  }));

  const summaryFile = path.join(outputDir, 'latest-evaluation.json');
  fs.writeFileSync(summaryFile, JSON.stringify({ timestamp: new Date().toISOString(), results: summary }, null, 2));
  
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
        if (item.alternatives.length > 0) {
          console.log(`  Alternatives: ${item.alternatives.join(', ')}`);
        }
      });
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Evaluation failed:', error);
      process.exit(1);
    });
}

module.exports = { evaluateModels, saveResults };
