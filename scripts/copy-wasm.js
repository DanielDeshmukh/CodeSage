const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const wasmFiles = [
  { src: 'node_modules/web-tree-sitter/web-tree-sitter.wasm', dest: 'tree-sitter.wasm' },
  { src: 'node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm', dest: 'tree-sitter-javascript.wasm' },
  { src: 'node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm', dest: 'tree-sitter-typescript.wasm' },
  { src: 'node_modules/tree-sitter-typescript/tree-sitter-tsx.wasm', dest: 'tree-sitter-tsx.wasm' },
  { src: 'node_modules/tree-sitter-python/tree-sitter-python.wasm', dest: 'tree-sitter-python.wasm' },
  { src: 'node_modules/tree-sitter-java/tree-sitter-java.wasm', dest: 'tree-sitter-java.wasm' },
];

for (const { src, dest } of wasmFiles) {
  const srcPath = path.join(__dirname, '..', src);
  const destPath = path.join(publicDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${dest}`);
  } else {
    console.warn(`Warning: ${src} not found`);
  }
}
