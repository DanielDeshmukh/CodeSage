import { getGitHubService } from "@/services/github";
import { getRepositoryCloner } from "./cloner";
import { getFileWalker } from "./file-walker";
import { getLanguageDetector } from "./language-detector";
import { getSafetyPreFilter } from "./safety-filter";
import { getEmbeddingPipeline } from "@/backend/vector/embedding-pipeline";
import { getChunkNormalizer, type NormalizedChunk } from "@/backend/ast/normalizer";
import { parseFileAsync, getLanguageFromFilePath } from "@/backend/ast/parser";
import { readFile } from "fs/promises";

export interface IngestionProgress {
  stage:
    | "validating"
    | "cloning"
    | "walking"
    | "detecting"
    | "safety"
    | "parsing"
    | "enriching"
    | "embedding"
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
    chunksEmbedded?: number;
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
  private embeddingPipeline = getEmbeddingPipeline();
  private normalizer = getChunkNormalizer();

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
              content: content.slice(0, 10000),
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

      // Stage 6: Parse files with AST
      this.reportProgress({
        stage: "parsing",
        message: "Parsing source code with AST...",
        progress: 70,
      });

      const safeFiles = filesWithContent.filter(
        (f) => !safetyResult.results.has(f.id) || safetyResult.results.get(f.id)?.safety.isSafe !== false
      );

      const allChunks: Array<{
        id: string;
        type: string;
        name: string;
        language: string;
        content: string;
        startLine: number;
        endLine: number;
        calls: string[];
        complexity: number;
        hasTodos: boolean;
      }> = [];

      for (const file of safeFiles) {
        const language = getLanguageFromFilePath(file.path);
        if (!language) continue;

        try {
          const chunks = await parseFileAsync(file.content, file.path, language);
          for (const chunk of chunks) {
            allChunks.push({
              id: `${repoId}-${file.path}-${chunk.name}`,
              type: chunk.type,
              name: chunk.name,
              language: chunk.language,
              content: chunk.content,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              calls: chunk.calls,
              complexity: chunk.complexity,
              hasTodos: chunk.hasTodos,
            });
          }
        } catch {
          // Skip files that fail to parse
        }
      }

      // Normalize chunks - normalize each file's chunks
      const normalizedChunks: NormalizedChunk[] = [];

      for (const file of safeFiles) {
        const language = getLanguageFromFilePath(file.path);
        if (!language) continue;

        try {
          const chunks = await parseFileAsync(file.content, file.path, language);
          const normalized = this.normalizer.normalize(chunks, file.path);
          normalizedChunks.push(...normalized);
        } catch {
          // Skip files that fail to parse
        }
      }

      // Stage 7: Generate embeddings and store in Qdrant
      this.reportProgress({
        stage: "embedding",
        message: `Generating embeddings for ${normalizedChunks.length} chunks...`,
        progress: 80,
      });

      let chunksEmbedded = 0;
      try {
        const embedResult = await this.embeddingPipeline.embedAndStore(
          normalizedChunks,
          repoId
        );
        chunksEmbedded = embedResult.chunksEmbedded;
      } catch (error) {
        console.warn("Embedding failed (non-fatal):", error);
        // Continue without embeddings - questions will use content directly
      }

      // Stage 8: Complete
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
          chunksEmbedded,
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
