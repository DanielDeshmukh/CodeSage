import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";

export interface CloneOptions {
  repoUrl: string;
  targetDir: string;
  depth?: number;
  branch?: string;
}

export interface CloneResult {
  success: boolean;
  path: string;
  error?: string;
  durationMs: number;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || undefined;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }
  return headers;
}

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) return { owner: match[1], repo: match[2] };
  const slashMatch = url.match(/^([^/]+)\/([^/]+)$/);
  if (slashMatch) return { owner: slashMatch[1], repo: slashMatch[2] };
  return null;
}

interface TreeEntry {
  path: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

async function getFileTree(
  owner: string,
  repo: string,
  branch: string
): Promise<TreeEntry[]> {
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: getHeaders() }
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to fetch repo tree: ${treeRes.status}`);
  }

  const treeData = await treeRes.json();
  return (treeData.tree as TreeEntry[]).filter(
    (entry) => entry.type === "blob"
  );
}

async function getFileContent(
  owner: string,
  repo: string,
  sha: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`,
    {
      headers: { ...getHeaders(), Accept: "application/vnd.github.v3.raw" },
    }
  );

  if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
  return res.text();
}

const SKIP_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".lock", ".min.js", ".min.css",
  ".pyc", ".pyo", ".class", ".o", ".so",
  ".exe", ".dll", ".dylib",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build",
  "__pycache__", ".vscode", ".idea", ".cache",
  "coverage", ".nyc_output", "vendor",
]);

function shouldSkipFile(path: string): boolean {
  const parts = path.split("/");
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  const ext = "." + path.split(".").pop()?.toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return true;
  return false;
}

export class RepositoryCloner {
  private tempDir: string;

  constructor(tempDir: string = "/tmp/codesage/repos") {
    this.tempDir = tempDir;
  }

  async clone(options: CloneOptions): Promise<CloneResult> {
    const startTime = Date.now();
    const targetPath = join(this.tempDir, options.targetDir);

    try {
      if (existsSync(targetPath)) {
        rmSync(targetPath, { recursive: true, force: true });
      }

      const parsed = parseRepoUrl(options.repoUrl);
      if (!parsed) throw new Error("Invalid GitHub URL");

      const branch = options.branch || "main";

      // Try main first, fall back to master
      let entries: TreeEntry[];
      try {
        entries = await getFileTree(parsed.owner, parsed.repo, branch);
      } catch {
        entries = await getFileTree(parsed.owner, parsed.repo, "master");
      }

      // Filter to source files only
      const sourceFiles = entries.filter((e) => !shouldSkipFile(e.path));

      // Download and write files (limit to 500 files for serverless)
      const filesToFetch = sourceFiles.slice(0, 500);

      await Promise.all(
        filesToFetch.map(async (entry) => {
          try {
            const content = await getFileContent(
              parsed.owner,
              parsed.repo,
              entry.sha
            );
            const filePath = join(targetPath, entry.path);
            mkdirSync(dirname(filePath), { recursive: true });
            writeFileSync(filePath, content, "utf-8");
          } catch {
            // Skip files that fail to download
          }
        })
      );

      return {
        success: true,
        path: targetPath,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        path: targetPath,
        error: error instanceof Error ? error.message : "Clone failed",
        durationMs: Date.now() - startTime,
      };
    }
  }

  async cleanup(path: string): Promise<void> {
    try {
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  async getRepoSize(path: string): Promise<number> {
    // Approximate size — du won't be available on Vercel either
    return 0;
  }
}

let instance: RepositoryCloner | null = null;

export function getRepositoryCloner(): RepositoryCloner {
  if (!instance) {
    instance = new RepositoryCloner();
  }
  return instance;
}
