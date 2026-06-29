import { v4 as uuidv4 } from "uuid";
import { getGitHubClient, type GitHubFile } from "@/services/github";
import { getNIMGateway } from "@/ai/nim/gateway";
import { getQdrantClient, type QdrantPoint } from "@/backend/vector/qdrant";
import { parseFile, getLanguageFromFilePath, type ParsedChunk } from "@/backend/ast/parser";
import type { CodeChunk, Repository, RepositoryStats, LanguageStat } from "@/types";

// ============================================================================
// Repository Ingestion Pipeline
// ============================================================================

export interface IngestionProgress {
  repositoryId: string;
  status: "cloning" | "parsing" | "embedding" | "indexing" | "ready" | "error";
  currentStep: number;
  totalSteps: number;
  message: string;
}

export type ProgressCallback = (progress: IngestionProgress) => void;

export class IngestionPipeline {
  private github = getGitHubClient();
  private nim = getNIMGateway();
  private qdrant = getQdrantClient();
  private progressCallback?: ProgressCallback;

  setProgressCallback(callback: ProgressCallback) {
    this.progressCallback = callback;
  }

  private reportProgress(
    progress: Omit<IngestionProgress, "totalSteps"> & { totalSteps?: number }
  ) {
    if (this.progressCallback) {
      this.progressCallback({
        ...progress,
        totalSteps: progress.totalSteps || 4,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Main Pipeline
  // --------------------------------------------------------------------------

  async ingestRepository(
    repositoryUrl: string,
    existingRepo?: Repository
  ): Promise<{ repository: Repository; chunks: CodeChunk[] }> {
    const repoInfo = this.github.parseRepoUrl(repositoryUrl);
    if (!repoInfo) {
      throw new Error("Invalid GitHub repository URL");
    }

    const repositoryId = existingRepo?.id || uuidv4();

    try {
      // Step 1: Clone repository
      this.reportProgress({
        repositoryId,
        status: "cloning",
        currentStep: 1,
        message: "Cloning repository...",
      });

      const files = await this.github.cloneRepository(
        repoInfo.owner,
        repoInfo.repo
      );

      // Step 2: Parse files with AST
      this.reportProgress({
        repositoryId,
        status: "parsing",
        currentStep: 2,
        message: `Parsing ${files.length} files...`,
      });

      const allChunks: ParsedChunk[] = [];
      const languageStats: Map<string, { files: number; lines: number }> = new Map();

      for (const file of files) {
        const language = file.language || getLanguageFromFilePath(file.path);
        if (!language) continue;

        // Update language stats
        const stats = languageStats.get(language) || { files: 0, lines: 0 };
        stats.files++;
        stats.lines += file.content.split("\n").length;
        languageStats.set(language, stats);

        // Parse file
        const chunks = parseFile(file.content, file.path, language);
        allChunks.push(...chunks);
      }

      // Step 3: Generate embeddings
      this.reportProgress({
        repositoryId,
        status: "embedding",
        currentStep: 3,
        message: `Generating embeddings for ${allChunks.length} chunks...`,
      });

      const codeChunks: CodeChunk[] = allChunks.map((chunk) => ({
        id: uuidv4(),
        repositoryId,
        type: chunk.type,
        name: chunk.name,
        filePath: "", // Will be set from file
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        content: chunk.content,
        docstring: null,
        language: chunk.language,
        calls: chunk.calls,
        calledBy: [],
        complexity: chunk.complexity,
        hasTodos: chunk.hasTodos,
        dependencyCount: chunk.dependencyCount,
        summary: null,
        embedding: null,
      }));

      // Generate embeddings in batches
      const batchSize = 10;
      for (let i = 0; i < codeChunks.length; i += batchSize) {
        const batch = codeChunks.slice(i, i + batchSize);
        const texts = batch.map(
          (chunk) =>
            `${chunk.type} ${chunk.name}\n${chunk.content.slice(0, 500)}`
        );

        try {
          const embeddingResponse = await this.nim.embed(texts);
          batch.forEach((chunk, idx) => {
            chunk.embedding = embeddingResponse.embeddings[idx];
          });
        } catch (error) {
          console.error("Embedding generation failed:", error);
        }
      }

      // Step 4: Index in Qdrant
      this.reportProgress({
        repositoryId,
        status: "indexing",
        currentStep: 4,
        message: `Indexing ${codeChunks.length} chunks...`,
      });

      await this.qdrant.ensureCollection();

      const points: QdrantPoint[] = codeChunks
        .filter((chunk) => chunk.embedding !== null)
        .map((chunk) => ({
          id: chunk.id,
          vector: chunk.embedding!,
          payload: {
            repositoryId: chunk.repositoryId,
            chunkId: chunk.id,
            type: chunk.type,
            name: chunk.name,
            filePath: chunk.filePath,
            language: chunk.language,
            content: chunk.content,
            summary: chunk.summary,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
          },
        }));

      if (points.length > 0) {
        await this.qdrant.upsertPoints(points);
      }

      // Calculate stats
      const totalFiles = files.length;
      const sourceFiles = files.filter(
        (f) => f.language !== null
      ).length;
      const totalLines = files.reduce(
        (sum, f) => sum + f.content.split("\n").length,
        0
      );

      const languages: LanguageStat[] = Array.from(languageStats.entries()).map(
        ([language, stats]) => ({
          language,
          files: stats.files,
          lines: stats.lines,
          percentage: Math.round((stats.lines / totalLines) * 100),
        })
      );

      const stats: RepositoryStats = {
        totalFiles,
        sourceFiles,
        totalLines,
        languages,
        chunks: codeChunks.length,
      };

      const repoInfoData = await this.github.getRepoInfo(
        repoInfo.owner,
        repoInfo.repo
      );

      const repository: Repository = {
        id: repositoryId,
        name: repoInfoData.name,
        fullName: repoInfoData.fullName,
        url: repositoryUrl,
        description: repoInfoData.description,
        defaultBranch: repoInfoData.defaultBranch,
        language: repoInfoData.language,
        stars: repoInfoData.stars,
        forks: repoInfoData.forks,
        createdAt: repoInfoData.createdAt,
        updatedAt: repoInfoData.updatedAt,
        ingestedAt: new Date().toISOString(),
        status: "ready",
        stats,
      };

      // Report completion
      this.reportProgress({
        repositoryId,
        status: "ready",
        currentStep: 4,
        totalSteps: 4,
        message: `Successfully indexed ${codeChunks.length} chunks from ${sourceFiles} files`,
      });

      return { repository, chunks: codeChunks };
    } catch (error) {
      this.reportProgress({
        repositoryId,
        status: "error",
        currentStep: 0,
        message: `Ingestion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Search Repository
  // --------------------------------------------------------------------------

  async searchRepository(
    repositoryId: string,
    query: string,
    options: {
      limit?: number;
      type?: string;
    } = {}
  ): Promise<
    {
      chunk: CodeChunk;
      score: number;
    }[]
  > {
    // Generate query embedding
    const embeddingResponse = await this.nim.embed(query);
    const queryVector = embeddingResponse.embeddings[0];

    // Search in Qdrant
    const results = await this.qdrant.search(queryVector, {
      filter: {
        repositoryId,
        type: options.type,
      },
      limit: options.limit || 10,
    });

    // Map results to CodeChunk objects
    return results.map((result) => ({
      chunk: {
        id: result.payload.chunkId,
        repositoryId: result.payload.repositoryId,
        type: result.payload.type as CodeChunk["type"],
        name: result.payload.name,
        filePath: result.payload.filePath,
        startLine: result.payload.startLine,
        endLine: result.payload.endLine,
        content: result.payload.content,
        docstring: null,
        language: result.payload.language,
        calls: [],
        calledBy: [],
        complexity: 1,
        hasTodos: false,
        dependencyCount: 0,
        summary: result.payload.summary,
        embedding: null,
      },
      score: result.score,
    }));
  }
}

// Singleton instance
let pipelineInstance: IngestionPipeline | null = null;

export function getIngestionPipeline(): IngestionPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new IngestionPipeline();
  }
  return pipelineInstance;
}
