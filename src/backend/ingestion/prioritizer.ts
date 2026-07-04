import { extname, basename, dirname } from "path";

export interface FileToPrioritize {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  sha?: string;
}

export interface PrioritizedFile extends FileToPrioritize {
  priority: number;
  reason: string;
}

// --- Tier definitions (higher = more important) ---

const ENTRY_POINT_NAMES = new Set([
  "index.ts", "index.tsx", "index.js", "index.jsx",
  "main.ts", "main.tsx", "main.js", "main.py",
  "app.tsx", "app.ts", "app.js", "App.tsx", "App.ts",
  "server.ts", "server.js",
  "cli.ts", "cli.js",
  "index.html",
]);

const CORE_DIRS = new Set([
  "src", "lib", "core", "services", "models", "controllers",
  "routes", "middleware", "handlers", "api", "engine",
  "components", "pages", "views", "hooks", "stores",
]);

const UTILITY_DIRS = new Set([
  "utils", "helpers", "shared", "common", "internal",
]);

const TEST_EXTENSIONS = new Set([".test.", ".spec.", ".d."]);

function basenameLower(filePath: string): string {
  return basename(filePath).toLowerCase();
}

function dirnameParts(filePath: string): string[] {
  return dirname(filePath).split(/[/\\]/).map((d) => d.toLowerCase());
}

function isTestFile(filePath: string): boolean {
  const name = basenameLower(filePath);
  return TEST_EXTENSIONS.has(name) ||
    name.includes(".test.") ||
    name.includes(".spec.") ||
    dirnameParts(filePath).includes("__tests__") ||
    dirnameParts(filePath).includes("__mocks__");
}

function isConfigFile(filePath: string): boolean {
  const name = basenameLower(filePath);
  return name.includes("config") ||
    name.endsWith(".config.js") ||
    name.endsWith(".config.ts") ||
    name.endsWith(".config.mjs") ||
    name === "tsconfig.json" ||
    name === "package.json" ||
    name === ".eslintrc" ||
    name === ".prettierrc" ||
    name.endsWith(".env") ||
    name.endsWith(".env.local");
}

function isDocFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext === ".md" || ext === ".txt" || ext === ".rst";
}

/**
 * Score a file for importance. Higher = more important.
 *
 * Scoring breakdown (max ~100):
 *   Tier base:     0-60
 *   Size bonus:    0-25
 *   Depth penalty: -2 per level deep
 *   Special bonus: +10 for entry points in core dirs
 */
export function scoreFile(file: FileToPrioritize): PrioritizedFile {
  const name = basenameLower(file.path);
  const parts = dirnameParts(file.path);
  const ext = file.extension.toLowerCase();

  let score = 0;
  let reason = "";

  // --- Tier base score ---
  if (ENTRY_POINT_NAMES.has(name)) {
    score = 60;
    reason = "entry point";
  } else if (parts.some((d) => CORE_DIRS.has(d))) {
    score = 45;
    reason = "core module";
  } else if (parts.some((d) => UTILITY_DIRS.has(d))) {
    score = 30;
    reason = "utility";
  } else if (isTestFile(file.path)) {
    score = 15;
    reason = "test file";
  } else if (isConfigFile(file.path)) {
    score = 10;
    reason = "config";
  } else if (isDocFile(file.path)) {
    score = 8;
    reason = "documentation";
  } else {
    score = 25;
    reason = "other source";
  }

  // --- Size bonus (larger files = more logic) ---
  // 0-25 points based on file size
  // ~500 bytes = 5pts, ~2KB = 10pts, ~5KB = 15pts, ~10KB+ = 25pts
  const sizeKB = file.size / 1024;
  let sizeBonus = 0;
  if (sizeKB < 0.5) sizeBonus = 2;
  else if (sizeKB < 2) sizeBonus = 8;
  else if (sizeKB < 5) sizeBonus = 14;
  else if (sizeKB < 10) sizeBonus = 20;
  else sizeBonus = 25;

  score += sizeBonus;
  if (reason === "other source") reason = `source (${Math.round(sizeKB)}KB)`;

  // --- Depth penalty (deeper = less foundational) ---
  const depth = parts.filter((p) => p !== "." && p !== "").length;
  score -= depth * 2;

  // --- Bonus: entry point in a core dir ---
  if (ENTRY_POINT_NAMES.has(name) && parts.some((d) => CORE_DIRS.has(d))) {
    score += 10;
    reason = "core entry point";
  }

  // --- Bonus: TypeScript/Python/Go over others ---
  const premiumExts = new Set([".ts", ".tsx", ".py", ".go", ".rs", ".java"]);
  if (premiumExts.has(ext)) {
    score += 3;
  }

  // Clamp to 0
  score = Math.max(0, score);

  return {
    ...file,
    priority: score,
    reason,
  };
}

/**
 * Given a flat list of files from the repo tree, rank them by importance
 * and return the top N. Ensures at least one file from every top-level
 * directory is included (diversity guarantee).
 */
export function prioritizeFiles(
  files: FileToPrioritize[],
  budget: number = 500
): PrioritizedFile[] {
  // Score all files
  const scored = files.map(scoreFile);

  // Sort descending by priority, then by size as tiebreaker
  scored.sort((a, b) => b.priority - a.priority || b.size - a.size);

  // Diversity guarantee: ensure at least 1 file per top-level directory
  const topDirs = new Map<string, PrioritizedFile[]>();
  for (const f of scored) {
    const topDir = f.relativePath.split(/[/\\]/)[0] || ".";
    if (!topDirs.has(topDir)) topDirs.set(topDir, []);
    topDirs.get(topDir)!.push(f);
  }

  const selected: PrioritizedFile[] = [];
  const selectedPaths = new Set<string>();

  // First pass: take the best file from each top-level dir
  for (const [, dirFiles] of topDirs) {
    if (selected.length >= budget) break;
    const best = dirFiles[0];
    if (!selectedPaths.has(best.path)) {
      selected.push(best);
      selectedPaths.add(best.path);
    }
  }

  // Second pass: fill remaining budget from the global ranking
  for (const f of scored) {
    if (selected.length >= budget) break;
    if (!selectedPaths.has(f.path)) {
      selected.push(f);
      selectedPaths.add(f.path);
    }
  }

  return selected;
}
