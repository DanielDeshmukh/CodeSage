import { readdir, stat } from "fs/promises";
import { join, extname, relative } from "path";

export interface FileEntry {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
}

export interface WalkOptions {
  excludeDirs?: string[];
  excludeExtensions?: string[];
  includeExtensions?: string[];
  maxFileSize?: number; // in bytes
  maxDepth?: number;
}

const DEFAULT_EXCLUDE_DIRS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  "vendor",
  ".idea",
  ".vscode",
];

const DEFAULT_EXCLUDE_EXTENSIONS = [
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".o",
  ".a",
  ".lib",
  ".bin",
  ".dat",
  ".db",
  ".sqlite",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".svg",
  ".mp3",
  ".mp4",
  ".avi",
  ".mov",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
];

export class FileWalker {
  private options: Required<WalkOptions>;

  constructor(options: WalkOptions = {}) {
    this.options = {
      excludeDirs: options.excludeDirs || DEFAULT_EXCLUDE_DIRS,
      excludeExtensions: options.excludeExtensions || DEFAULT_EXCLUDE_EXTENSIONS,
      includeExtensions: options.includeExtensions || [],
      maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB default
      maxDepth: options.maxDepth || 20,
    };
  }

  async walk(dir: string, rootDir?: string): Promise<FileEntry[]> {
    const root = rootDir || dir;
    const files: FileEntry[] = [];

    await this.walkRecursive(dir, root, files, 0);
    return files;
  }

  private async walkRecursive(
    currentDir: string,
    rootDir: string,
    files: FileEntry[],
    depth: number
  ): Promise<void> {
    if (depth > this.options.maxDepth) {
      return;
    }

    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!this.shouldExcludeDir(entry.name)) {
            await this.walkRecursive(fullPath, rootDir, files, depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();

          if (this.shouldIncludeFile(ext)) {
            try {
              const fileStat = await stat(fullPath);
              if (fileStat.size <= this.options.maxFileSize) {
                files.push({
                  path: fullPath,
                  relativePath: relative(rootDir, fullPath),
                  extension: ext,
                  size: fileStat.size,
                });
              }
            } catch {
              // Skip files we can't stat
            }
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  private shouldExcludeDir(name: string): boolean {
    return this.options.excludeDirs.includes(name) || name.startsWith(".");
  }

  private shouldIncludeFile(ext: string): boolean {
    if (this.options.excludeExtensions.includes(ext)) {
      return false;
    }

    if (this.options.includeExtensions.length > 0) {
      return this.options.includeExtensions.includes(ext);
    }

    return true;
  }

  getSupportedExtensions(): string[] {
    return [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".cpp",
      ".c",
      ".h",
      ".cs",
      ".rb",
      ".php",
      ".swift",
      ".kt",
      ".scala",
      ".clj",
      ".ex",
      ".exs",
      ".hs",
      ".ml",
      ".fs",
      ".vue",
      ".svelte",
    ];
  }
}

let instance: FileWalker | null = null;

export function getFileWalker(options?: WalkOptions): FileWalker {
  if (!instance) {
    instance = new FileWalker(options);
  }
  return instance;
}
