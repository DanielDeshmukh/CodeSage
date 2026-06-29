import { parseFile } from "./parser";
import { getChunkNormalizer, type NormalizedChunk } from "./normalizer";
import { getChunkSummarizer } from "./summarizer";
import { getComplexityScorer, type ComplexityMetrics } from "./complexity";
import { getCallGraphBuilder, type CallGraph } from "./callgraph";

export interface EnrichmentProgress {
  stage: "parsing" | "normalizing" | "summarizing" | "scoring" | "graphing" | "complete";
  message: string;
  progress: number;
  processed?: number;
  total?: number;
}

export interface EnrichmentResult {
  chunks: NormalizedChunk[];
  callGraph: CallGraph;
  complexityMetrics: Map<string, ComplexityMetrics>;
  stats: {
    totalChunks: number;
    avgComplexity: number;
    avgLines: number;
    riskDistribution: Record<string, number>;
  };
}

export class EnrichmentPipeline {
  private normalizer = getChunkNormalizer();
  private summarizer = getChunkSummarizer();
  private complexityScorer = getComplexityScorer();
  private callGraphBuilder = getCallGraphBuilder();

  private onProgress?: (progress: EnrichmentProgress) => void;

  setProgressCallback(callback: (progress: EnrichmentProgress) => void): void {
    this.onProgress = callback;
  }

  private reportProgress(progress: EnrichmentProgress): void {
    this.onProgress?.(progress);
  }

  async enrich(
    files: Array<{ path: string; content: string; language: string }>
  ): Promise<EnrichmentResult> {
    // Stage 1: Parse
    this.reportProgress({
      stage: "parsing",
      message: "Parsing source files...",
      progress: 0,
      total: files.length,
      processed: 0,
    });

    const allChunks: NormalizedChunk[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parsed = parseFile(file.content, file.path, file.language);
      const normalized = this.normalizer.normalize(parsed, file.path);
      allChunks.push(...normalized);

      this.reportProgress({
        stage: "parsing",
        message: `Parsed ${file.path}`,
        progress: Math.round(((i + 1) / files.length) * 20),
        processed: i + 1,
        total: files.length,
      });
    }

    // Stage 2: Normalize
    this.reportProgress({
      stage: "normalizing",
      message: "Building call graph...",
      progress: 20,
    });

    const callGraph = this.callGraphBuilder.build(allChunks);

    // Stage 3: Summarize
    this.reportProgress({
      stage: "summarizing",
      message: "Generating summaries...",
      progress: 30,
      total: allChunks.length,
      processed: 0,
    });

    const enrichedChunks = await this.summarizer.enrichBatch(allChunks);

    this.reportProgress({
      stage: "summarizing",
      message: "Summaries complete",
      progress: 70,
    });

    // Stage 4: Score complexity
    this.reportProgress({
      stage: "scoring",
      message: "Calculating complexity...",
      progress: 75,
    });

    const complexityMetrics = this.complexityScorer.calculateBatch(enrichedChunks);

    // Stage 5: Build final graph
    this.reportProgress({
      stage: "graphing",
      message: "Finalizing call graph...",
      progress: 90,
    });

    const finalCallGraph = this.callGraphBuilder.build(enrichedChunks);

    // Calculate stats
    const stats = this.calculateStats(enrichedChunks, complexityMetrics);

    this.reportProgress({
      stage: "complete",
      message: "Enrichment complete",
      progress: 100,
    });

    return {
      chunks: enrichedChunks,
      callGraph: finalCallGraph,
      complexityMetrics,
      stats,
    };
  }

  private calculateStats(
    chunks: NormalizedChunk[],
    metrics: Map<string, ComplexityMetrics>
  ): EnrichmentResult["stats"] {
    const totalChunks = chunks.length;
    const avgLines = chunks.reduce((sum, c) => sum + c.lineCount, 0) / totalChunks;
    const avgComplexity = chunks.reduce((sum, c) => sum + c.complexity, 0) / totalChunks;

    const riskDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const metric of metrics.values()) {
      riskDistribution[metric.riskLevel]++;
    }

    return {
      totalChunks,
      avgComplexity: Math.round(avgComplexity * 10) / 10,
      avgLines: Math.round(avgLines),
      riskDistribution,
    };
  }
}

let instance: EnrichmentPipeline | null = null;

export function getEnrichmentPipeline(): EnrichmentPipeline {
  if (!instance) {
    instance = new EnrichmentPipeline();
  }
  return instance;
}
