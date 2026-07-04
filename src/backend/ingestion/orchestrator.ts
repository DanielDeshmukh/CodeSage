import { getGitHubService } from "@/services/github";
import { getRepositoryCloner } from "./cloner";
import { getFileWalker } from "./file-walker";
import { getLanguageDetector } from "./language-detector";
import { getSafetyPreFilter } from "./safety-filter";
import { readFile } from "fs/promises";

export interface IngestionProgress {
  stage:
    | "validating"
    | "cloning"
    | "walking"
    | "detecting"
    | "safety"
    | "enriching"
    | "storing"
    | "complete";
  message: string;
  progress: number;
  filesProcessed?: number;
  totalFiles?: number;
}

export interface IngestionResult {
  success: boolean;
  repositoryId: string;
  stats: {
    totalFiles: number;
    safeFiles: number;
    unsafeFiles: number;
    languages: Record<string, number>;
    totalSize: number;
  };
  error?: string;
  durationMs: number;
}

export class IngestionOrchestrator {
  private githubService = getGitHubService();
  private cloner = getRepositoryCloner();
  private walker = getFileWalker();
  private detector = getLanguageDetector();
  private safetyFilter = getSafetyPreFilter();

  private onProgress?: (progress: IngestionProgress) => void;

  setProgressCallback(
    callback: (progress: IngestionProgress) => void
  ): void {
    this.onProgress = callback;
  }

  private reportProgress(progress: IngestionProgress): void {
    this.onProgress?.(progress);
  }

  async ingest(repoUrl: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const repoId = this.generateRepoId(repoUrl);

    try {
      // Stage 1: Validate
      this.reportProgress({
        stage: "validating",
        message: "Validating repository URL...",
        progress: 0,
      });

      const repoInfo = await this.githubService.getRepoInfo(repoUrl);
      if (!repoInfo) {
        throw new Error("Invalid or inaccessible repository");
      }

      // Stage 2: Clone
      this.reportProgress({
        stage: "cloning",
        message: "Cloning repository...",
        progress: 10,
      });

      const cloneResult = await this.cloner.clone({
        repoUrl: repoInfo.cloneUrl,
        targetDir: repoId,
        depth: 1,
        budget: 500,
      });

      if (!cloneResult.success) {
        throw new Error(`Clone failed: ${cloneResult.error}`);
      }

      this.reportProgress({
        stage: "cloning",
        message: `Downloaded ${cloneResult.filesDownloaded} of ${cloneResult.filesPrioritized} files (prioritized)`,
        progress: 25,
      });

      // Stage 3: Walk files
      this.reportProgress({
        stage: "walking",
        message: "Scanning files...",
        progress: 30,
      });

      const files = await this.walker.walk(cloneResult.path);
      this.reportProgress({
        stage: "walking",
        message: `Found ${files.length} source files`,
        progress: 40,
        totalFiles: files.length,
        filesProcessed: 0,
      });

      // Stage 4: Detect languages
      this.reportProgress({
        stage: "detecting",
        message: "Detecting languages...",
        progress: 50,
      });

      const languageStats = new Map<
        string,
        { count: number; totalSize: number }
      >();
      for (const file of files) {
        const detected = this.detector.detect(file.path);
        const current = languageStats.get(detected.language) || {
          count: 0,
          totalSize: 0,
        };
        languageStats.set(detected.language, {
          count: current.count + 1,
          totalSize: current.totalSize + file.size,
        });
      }

      // Stage 5: Safety check
      this.reportProgress({
        stage: "safety",
        message: "Running safety checks...",
        progress: 60,
      });

      const filesWithContent = await Promise.all(
        files.slice(0, 200).map(async (file) => {
          try {
            const content = await readFile(file.path, "utf-8");
            return {
              id: file.relativePath,
              path: file.relativePath,
              content: content.slice(0, 10000), // Limit content size
            };
          } catch {
            return {
              id: file.relativePath,
              path: file.relativePath,
              content: "",
            };
          }
        })
      );

      const safetyResult = await this.safetyFilter.filterFiles(
        filesWithContent
      );

      // Stage 6: Complete
      this.reportProgress({
        stage: "complete",
        message: "Ingestion complete",
        progress: 100,
        filesProcessed: files.length,
        totalFiles: files.length,
      });

      // Cleanup
      await this.cloner.cleanup(cloneResult.path);

      const languages: Record<string, number> = {};
      languageStats.forEach((stats, lang) => {
        languages[lang] = stats.count;
      });

      return {
        success: true,
        repositoryId: repoId,
        stats: {
          totalFiles: files.length,
          safeFiles: safetyResult.safeCount,
          unsafeFiles: safetyResult.unsafeCount,
          languages,
          totalSize: files.reduce((sum, f) => sum + f.size, 0),
        },
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        repositoryId: repoId,
        stats: {
          totalFiles: 0,
          safeFiles: 0,
          unsafeFiles: 0,
          languages: {},
          totalSize: 0,
        },
        error: error instanceof Error ? error.message : "Ingestion failed",
        durationMs: Date.now() - startTime,
      };
    }
  }

  private generateRepoId(url: string): string {
    const hash = url.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `repo-${Math.abs(hash).toString(36)}`;
  }
}

let instance: IngestionOrchestrator | null = null;

export function getIngestionOrchestrator(): IngestionOrchestrator {
  if (!instance) {
    instance = new IngestionOrchestrator();
  }
  return instance;
}
