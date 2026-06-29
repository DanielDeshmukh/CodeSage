import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, rmSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

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

export class RepositoryCloner {
  private tempDir: string;

  constructor(tempDir: string = "/tmp/codesage/repos") {
    this.tempDir = tempDir;
  }

  async clone(options: CloneOptions): Promise<CloneResult> {
    const startTime = Date.now();
    const targetPath = join(this.tempDir, options.targetDir);

    try {
      // Clean up existing directory if present
      if (existsSync(targetPath)) {
        rmSync(targetPath, { recursive: true, force: true });
      }

      const depthArg = options.depth ? `--depth ${options.depth}` : "";
      const branchArg = options.branch ? `-b ${options.branch}` : "";

      const command = `git clone ${depthArg} ${branchArg} --single-branch ${options.repoUrl} ${targetPath}`;

      await execAsync(command, {
        timeout: 120000, // 2 minute timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

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
    try {
      const { stdout } = await execAsync(`du -sb ${path} | cut -f1`);
      return parseInt(stdout.trim(), 10);
    } catch {
      return 0;
    }
  }
}

let instance: RepositoryCloner | null = null;

export function getRepositoryCloner(): RepositoryCloner {
  if (!instance) {
    instance = new RepositoryCloner();
  }
  return instance;
}
