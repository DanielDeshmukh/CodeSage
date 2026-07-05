const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const EVALUATION_FILE = path.join(__dirname, '../model-evaluations/latest-evaluation.json');

// Files to update with model references
const FILES_TO_UPDATE = {
  // Primary config files (must update first)
  'src/ai/nim/config.ts': {
    type: 'config',
    patterns: [
      { search: /NIM_EMBED_MODEL:\s*{[^}]*id:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_EMBED_MODEL: {\n    id: '${id}'` },
      { search: /NIM_RERANK_MODEL:\s*{[^}]*id:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_RERANK_MODEL: {\n    id: '${id}'` },
      { search: /NIM_EXAMINER_MODEL:\s*{[^}]*id:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_EXAMINER_MODEL: {\n    id: '${id}'` },
      { search: /NIM_SCORER_MODEL:\s*{[^}]*id:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_SCORER_MODEL: {\n    id: '${id}'` },
      { search: /NIM_SAFETY_MODEL:\s*{[^}]*id:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_SAFETY_MODEL: {\n    id: '${id}'` },
    ],
  },
  'src/lib/env.ts': {
    type: 'env',
    patterns: [
      { search: /NIM_EMBED_MODEL:\s*z\.string\(\)\.default\(['"][^'"]+['"]/g, replace: (id) => `NIM_EMBED_MODEL: z.string().default('${id}'` },
      { search: /NIM_RERANK_MODEL:\s*z\.string\(\)\.default\(['"][^'"]+['"]/g, replace: (id) => `NIM_RERANK_MODEL: z.string().default('${id}'` },
      { search: /NIM_EXAMINER_MODEL:\s*z\.string\(\)\.default\(['"][^'"]+['"]/g, replace: (id) => `NIM_EXAMINER_MODEL: z.string().default('${id}'` },
      { search: /NIM_SCORER_MODEL:\s*z\.string\(\)\.default\(['"][^'"]+['"]/g, replace: (id) => `NIM_SCORER_MODEL: z.string().default('${id}'` },
      { search: /NIM_SAFETY_MODEL:\s*z\.string\(\)\.default\(['"][^'"]+['"]/g, replace: (id) => `NIM_SAFETY_MODEL: z.string().default('${id}'` },
    ],
  },
  '.env': {
    type: 'env-file',
    patterns: [
      { search: /NIM_EMBED_MODEL=.*/g, replace: (id) => `NIM_EMBED_MODEL=${id}` },
      { search: /NIM_RERANK_MODEL=.*/g, replace: (id) => `NIM_RERANK_MODEL=${id}` },
      { search: /NIM_EXAMINER_MODEL=.*/g, replace: (id) => `NIM_EXAMINER_MODEL=${id}` },
      { search: /NIM_SCORER_MODEL=.*/g, replace: (id) => `NIM_SCORER_MODEL=${id}` },
      { search: /NIM_SAFETY_MODEL=.*/g, replace: (id) => `NIM_SAFETY_MODEL=${id}` },
    ],
  },
  '.env.example': {
    type: 'env-file',
    patterns: [
      { search: /NIM_EMBED_MODEL=.*/g, replace: (id) => `NIM_EMBED_MODEL=${id}` },
      { search: /NIM_RERANK_MODEL=.*/g, replace: (id) => `NIM_RERANK_MODEL=${id}` },
      { search: /NIM_EXAMINER_MODEL=.*/g, replace: (id) => `NIM_EXAMINER_MODEL=${id}` },
      { search: /NIM_SCORER_MODEL=.*/g, replace: (id) => `NIM_SCORER_MODEL=${id}` },
      { search: /NIM_SAFETY_MODEL=.*/g, replace: (id) => `NIM_SAFETY_MODEL=${id}` },
    ],
  },
  'src/ai/nim/client.ts': {
    type: 'client',
    patterns: [
      // Hardcoded embedding model
      { search: /case ['"]nvidia\/[^'"]*embed[^'"]*['"]/g, replace: (id) => `case '${id}'` },
      // Hardcoded reranker model  
      { search: /case ['"]nvidia\/[^'"]*rerank[^'"]*['"]/g, replace: (id) => `case '${id}'` },
      // Hardcoded chat models
      { search: /case ['"]nvidia\/[^'"]*(?:llama|nemotron)[^'"]*['"]/g, replace: (id) => `case '${id}'` },
    ],
  },
  'src/test/setup.ts': {
    type: 'test',
    patterns: [
      { search: /NIM_EMBED_MODEL:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_EMBED_MODEL: '${id}'` },
      { search: /NIM_RERANK_MODEL:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_RERANK_MODEL: '${id}'` },
      { search: /NIM_EXAMINER_MODEL:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_EXAMINER_MODEL: '${id}'` },
      { search: /NIM_SCORER_MODEL:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_SCORER_MODEL: '${id}'` },
      { search: /NIM_SAFETY_MODEL:\s*['"][^'"]+['"]/g, replace: (id) => `NIM_SAFETY_MODEL: '${id}'` },
    ],
  },
  'docker/docker-compose.prod.yml': {
    type: 'docker',
    patterns: [
      // Embedding model image
      { search: /image:\s*nvidia\/[^'"]*embed[^'"]*:latest/g, replace: (id) => `image: ${id}:latest` },
      // Reranker model image
      { search: /image:\s*nvidia\/[^'"]*rerank[^'"]*:latest/g, replace: (id) => `image: ${id}:latest` },
      // Chat model images
      { search: /image:\s*(?:nvidia|meta)\/[^'"]*(?:llama|nemotron)[^'"]*:latest/g, replace: (id) => `image: ${id}:latest` },
    ],
  },
};

// Model ID to Docker image mapping
const MODEL_TO_DOCKER_IMAGE = {
  'nvidia/nv-embedqa-e5-v5': 'nvcr.io/nvidia/nemo-retreival:latest',
  'nvidia/llama-nemotron-embed-1b-v2': 'nvcr.io/nvidia/llama-nemotron-embed-1b-v2:latest',
  'nvidia/llama-nemotron-rerank-1b-v2': 'nvcr.io/nvidia/llama-nemotron-rerank-1b-v2:latest',
  'nvidia/llama-3.3-nemotron-super-49b-v1': 'nvcr.io/nvidia/nemotron-super-49b-v1:latest',
  'nvidia/nemotron-4-340b-reward': 'nvcr.io/nvidia/nemotron-4-340b-reward:latest',
  'nvidia/nemotron-3.5-content-safety': 'nvcr.io/nvidia/nemotron-3.5-content-safety:latest',
};

// Read evaluation results
function loadEvaluationResults() {
  if (!fs.existsSync(EVALUATION_FILE)) {
    throw new Error(`Evaluation file not found: ${EVALUATION_FILE}`);
  }
  
  const data = JSON.parse(fs.readFileSync(EVALUATION_FILE, 'utf8'));
  return data.results;
}

// Update a single file
function updateFile(filePath, updates) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  for (const update of updates) {
    const newContent = content.replace(update.pattern, update.replacement);
    if (newContent !== content) {
      content = newContent;
      changes++;
    }
  }

  if (changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  Updated: ${filePath} (${changes} changes)`);
    return true;
  }

  return false;
}

// Generate file updates from evaluation results
function generateUpdates(evaluations) {
  const updates = [];

  for (const [task, data] of Object.entries(evaluations)) {
    if (!data.selected) {
      console.warn(`No model selected for task: ${task}`);
      continue;
    }

    const modelId = data.selected.modelId;
    const dockerImage = MODEL_TO_DOCKER_IMAGE[modelId] || `nvcr.io/nvidia/${modelId.split('/').pop()}:latest`;

    // Update config files
    for (const [filePath, config] of Object.entries(FILES_TO_UPDATE)) {
      const fileUpdates = [];

      for (const pattern of config.patterns) {
        // Create replacement function based on task
        let replacementFn;
        
        switch (task) {
          case 'embedding':
            if (pattern.search.toString().includes('embed')) {
              replacementFn = () => pattern.replace(modelId);
            }
            break;
          case 'reranker':
            if (pattern.search.toString().includes('rerank')) {
              replacementFn = () => pattern.replace(modelId);
            }
            break;
          case 'examiner':
          case 'scorer':
            if (pattern.search.toString().includes('llama') || pattern.search.toString().includes('nemotron')) {
              replacementFn = () => pattern.replace(modelId);
            }
            break;
          case 'safety':
            if (pattern.search.toString().includes('safety') || pattern.search.toString().includes('guard')) {
              replacementFn = () => pattern.replace(modelId);
            }
            break;
        }

        if (replacementFn) {
          fileUpdates.push({
            pattern: pattern.search,
            replacement: replacementFn(),
          });
        }
      }

      if (fileUpdates.length > 0) {
        updates.push({ filePath, updates: fileUpdates });
      }
    }
  }

  return updates;
}

// Update model display names in frontend
function updateDisplayName(modelId, role) {
  // Convert model ID to human-readable name
  const nameMap = {
    'nvidia/nv-embedqa-e5-v5': 'NV-Embed-QA',
    'nvidia/llama-nemotron-embed-1b-v2': 'Llama-Embed-1B',
    'nvidia/llama-nemotron-rerank-1b-v2': 'Llama-Rerank-1B',
    'nvidia/llama-3.3-nemotron-super-49b-v1': 'Llama-3.3-70B',
    'nvidia/nemotron-4-340b-reward': 'Nemotron-340B',
    'nvidia/nemotron-3.5-content-safety': 'Llama-Guard-3',
  };

  return nameMap[modelId] || modelId.split('/').pop();
}

// Main replacement function
async function replaceModels() {
  console.log('Starting model replacement...\n');

  try {
    // Load evaluation results
    const evaluations = loadEvaluationResults();
    console.log('Loaded evaluation results\n');

    // Generate updates
    const updates = generateUpdates(evaluations);
    
    if (updates.length === 0) {
      console.log('No updates needed');
      return;
    }

    // Apply updates
    let totalChanges = 0;
    
    for (const { filePath, updates: fileUpdates } of updates) {
      console.log(`Processing ${filePath}...`);
      const changed = updateFile(filePath, fileUpdates);
      if (changed) totalChanges++;
    }

    // Update frontend display names
    console.log('\nUpdating frontend display names...');
    const frontendUpdates = [];
    
    for (const [task, data] of Object.entries(evaluations)) {
      if (data.selected) {
        const displayName = updateDisplayName(data.selected.modelId, task);
        frontendUpdates.push({ task, displayName, modelId: data.selected.modelId });
      }
    }

    // Save frontend updates for manual review
    if (frontendUpdates.length > 0) {
      const frontendFile = path.join(__dirname, '../model-evaluations/frontend-updates.json');
      fs.writeFileSync(frontendFile, JSON.stringify(frontendUpdates, null, 2));
      console.log(`  Frontend updates saved to: ${frontendFile}`);
    }

    console.log(`\nCompleted! Updated ${totalChanges} files`);
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      models: Object.entries(evaluations).map(([task, data]) => ({
        task,
        previousModel: 'unknown', // Would need to track previous models
        newModel: data.selected?.modelId || 'None',
        score: data.selected?.score || 0,
      })),
      filesUpdated: totalChanges,
    };

    const summaryFile = path.join(__dirname, '../model-evaluations/replacement-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    return summary;

  } catch (error) {
    console.error('Replacement failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  replaceModels()
    .then(summary => {
      console.log('\nReplacement Summary:');
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { replaceModels, loadEvaluationResults };
