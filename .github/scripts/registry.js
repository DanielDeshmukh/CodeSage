const fs = require('fs');
const path = require('path');

// Model registry to track all model versions
const REGISTRY_FILE = path.join(__dirname, '../model-evaluations/model-registry.json');

// Default registry structure
const DEFAULT_REGISTRY = {
  version: '1.0.0',
  lastUpdated: null,
  models: {
    embedding: {
      current: null,
      history: [],
      performance: {},
    },
    reranker: {
      current: null,
      history: [],
      performance: {},
    },
    examiner: {
      current: null,
      history: [],
      performance: {},
    },
    scorer: {
      current: null,
      history: [],
      performance: {},
    },
    safety: {
      current: null,
      history: [],
      performance: {},
    },
  },
  files: {
    'src/ai/nim/config.ts': { lastUpdated: null, version: null },
    'src/lib/env.ts': { lastUpdated: null, version: null },
    '.env': { lastUpdated: null, version: null },
    '.env.example': { lastUpdated: null, version: null },
    'src/ai/nim/client.ts': { lastUpdated: null, version: null },
    'src/test/setup.ts': { lastUpdated: null, version: null },
    'docker/docker-compose.prod.yml': { lastUpdated: null, version: null },
    'src/app/page.tsx': { lastUpdated: null, version: null },
    'e2e/codesage.spec.ts': { lastUpdated: null, version: null },
    'codesage_landing_page.html': { lastUpdated: null, version: null },
    'README.md': { lastUpdated: null, version: null },
    'PITCH.md': { lastUpdated: null, version: null },
    'DEVELOPMENT_PLAN.md': { lastUpdated: null, version: null },
  },
};

// Load or create registry
function loadRegistry() {
  if (fs.existsSync(REGISTRY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
    } catch (error) {
      console.warn('Failed to load registry, creating new one:', error.message);
    }
  }
  
  return { ...DEFAULT_REGISTRY };
}

// Save registry
function saveRegistry(registry) {
  const dir = path.dirname(REGISTRY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  registry.lastUpdated = new Date().toISOString();
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

// Update model in registry
function updateModel(registry, task, modelId, metadata = {}) {
  const timestamp = new Date().toISOString();
  
  // Move current to history
  if (registry.models[task].current) {
    registry.models[task].history.push({
      ...registry.models[task].current,
      retiredAt: timestamp,
    });
  }
  
  // Set new current
  registry.models[task].current = {
    id: modelId,
    activatedAt: timestamp,
    ...metadata,
  };
  
  // Update performance metrics
  if (metadata.performance) {
    registry.models[task].performance = {
      ...registry.models[task].performance,
      [modelId]: metadata.performance,
    };
  }
  
  return registry;
}

// Update file version
function updateFileVersion(registry, filePath, version) {
  const timestamp = new Date().toISOString();
  
  if (registry.files[filePath]) {
    registry.files[filePath] = {
      lastUpdated: timestamp,
      version: version,
    };
  }
  
  return registry;
}

// Generate diff report
function generateDiffReport(oldRegistry, newRegistry) {
  const diff = {
    timestamp: new Date().toISOString(),
    changes: [],
    summary: {
      modelsChanged: 0,
      filesChanged: 0,
      newModels: [],
      retiredModels: [],
    },
  };

  // Compare models
  for (const [task, data] of Object.entries(newRegistry.models)) {
    const oldModel = oldRegistry.models[task]?.current?.id;
    const newModel = data.current?.id;
    
    if (oldModel !== newModel) {
      diff.changes.push({
        type: 'model',
        task,
        from: oldModel,
        to: newModel,
        timestamp: data.current?.activatedAt,
      });
      
      diff.summary.modelsChanged++;
      
      if (newModel && !oldModel) {
        diff.summary.newModels.push({ task, model: newModel });
      } else if (oldModel && !newModel) {
        diff.summary.retiredModels.push({ task, model: oldModel });
      } else {
        diff.summary.newModels.push({ task, model: newModel });
        diff.summary.retiredModels.push({ task, model: oldModel });
      }
    }
  }

  // Compare files
  for (const [filePath, data] of Object.entries(newRegistry.files)) {
    const oldVersion = oldRegistry.files[filePath]?.version;
    const newVersion = data.version;
    
    if (oldVersion !== newVersion) {
      diff.changes.push({
        type: 'file',
        path: filePath,
        from: oldVersion,
        to: newVersion,
        timestamp: data.lastUpdated,
      });
      
      diff.summary.filesChanged++;
    }
  }

  return diff;
}

// Validate registry integrity
function validateRegistry(registry) {
  const issues = [];
  
  // Check required tasks
  const requiredTasks = ['embedding', 'reranker', 'examiner', 'scorer', 'safety'];
  
  for (const task of requiredTasks) {
    if (!registry.models[task]) {
      issues.push(`Missing task: ${task}`);
    } else if (!registry.models[task].current) {
      issues.push(`No current model for task: ${task}`);
    }
  }
  
  // Check file references
  for (const filePath of Object.keys(registry.files)) {
    if (!fs.existsSync(path.join(__dirname, '../..', filePath))) {
      issues.push(`Referenced file does not exist: ${filePath}`);
    }
  }
  
  // Check for duplicate models (no single model for multiple tasks)
  const modelTasks = {};
  
  for (const [task, data] of Object.entries(registry.models)) {
    if (data.current?.id) {
      const modelId = data.current.id;
      if (!modelTasks[modelId]) {
        modelTasks[modelId] = [];
      }
      modelTasks[modelId].push(task);
    }
  }
  
  for (const [modelId, tasks] of Object.entries(modelTasks)) {
    if (tasks.length > 1) {
      issues.push(`Model ${modelId} is used for multiple tasks: ${tasks.join(', ')}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

// Export registry for external use
function exportRegistry(registry, format = 'json') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  switch (format) {
    case 'json':
      return JSON.stringify(registry, null, 2);
    
    case 'markdown':
      let md = `# NIM Model Registry\n\n`;
      md += `**Last Updated:** ${registry.lastUpdated}\n\n`;
      
      md += `## Current Models\n\n`;
      md += `| Task | Model | Activated |\n`;
      md += `|------|-------|------------|\n`;
      
      for (const [task, data] of Object.entries(registry.models)) {
        if (data.current) {
          md += `| ${task} | ${data.current.id} | ${data.current.activatedAt} |\n`;
        }
      }
      
      md += `\n## File Versions\n\n`;
      md += `| File | Last Updated | Version |\n`;
      md += `|------|--------------|----------|\n`;
      
      for (const [filePath, data] of Object.entries(registry.files)) {
        if (data.lastUpdated) {
          md += `| ${filePath} | ${data.lastUpdated} | ${data.version} |\n`;
        }
      }
      
      return md;
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  const registry = loadRegistry();
  
  switch (command) {
    case 'validate':
      const validation = validateRegistry(registry);
      if (validation.valid) {
        console.log('✅ Registry is valid');
      } else {
        console.log('❌ Registry has issues:');
        validation.issues.forEach(issue => console.log(`  - ${issue}`));
        process.exit(1);
      }
      break;
    
    case 'export':
      const format = args[0] || 'json';
      console.log(exportRegistry(registry, format));
      break;
    
    case 'history':
      const task = args[0];
      if (task && registry.models[task]) {
        console.log(`History for ${task}:`);
        console.log(JSON.stringify(registry.models[task].history, null, 2));
      } else {
        console.log('Usage: node registry.js history <task>');
        console.log('Tasks: embedding, reranker, examiner, scorer, safety');
      }
      break;
    
    case 'diff':
      const oldRegistryFile = args[0];
      if (oldRegistryFile && fs.existsSync(oldRegistryFile)) {
        const oldRegistry = JSON.parse(fs.readFileSync(oldRegistryFile, 'utf8'));
        const diff = generateDiffReport(oldRegistry, registry);
        console.log(JSON.stringify(diff, null, 2));
      } else {
        console.log('Usage: node registry.js diff <old-registry-file>');
      }
      break;
    
    default:
      console.log('NIM Model Registry Manager');
      console.log('');
      console.log('Commands:');
      console.log('  validate           Validate registry integrity');
      console.log('  export [format]    Export registry (json/markdown)');
      console.log('  history <task>     Show model history for a task');
      console.log('  diff <file>        Compare with previous registry');
      console.log('');
      console.log('Tasks: embedding, reranker, examiner, scorer, safety');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  loadRegistry,
  saveRegistry,
  updateModel,
  updateFileVersion,
  generateDiffReport,
  validateRegistry,
  exportRegistry,
};
