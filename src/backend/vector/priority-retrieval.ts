import { getRetrievalPipeline, type RetrievedChunk } from "./retrieval";
import type { SearchFilter } from "./qdrant";

export interface PriorityOptions {
  repositoryId: string;
  query: string;
  topK?: number;
  prioritizeComplexity?: boolean;
  prioritizeDependencies?: boolean;
  preferFunctions?: boolean;
  preferClasses?: boolean;
}

export interface PrioritizedChunk extends RetrievedChunk {
  priorityScore: number;
  priorityFactors: {
    relevance: number;
    complexity: number;
    dependencies: number;
    typeBonus: number;
  };
}

export class PriorityRetrieval {
  private retrievalPipeline = getRetrievalPipeline();

  async retrievePrioritized(
    options: PriorityOptions
  ): Promise<PrioritizedChunk[]> {
    const {
      repositoryId,
      query,
      topK = 5,
      prioritizeComplexity = true,
      prioritizeDependencies = true,
      preferFunctions = false,
      preferClasses = false,
    } = options;

    // Get initial candidates
    const result = await this.retrievalPipeline.retrieve({
      repositoryId,
      query,
      topK: topK * 3,
      rerankTopN: topK * 2,
    });

    // Score and prioritize
    const prioritized = result.chunks.map((chunk) =>
      this.calculatePriorityScore(chunk, {
        prioritizeComplexity,
        prioritizeDependencies,
        preferFunctions,
        preferClasses,
      })
    );

    // Sort by priority score
    prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

    // Return top-K
    return prioritized.slice(0, topK);
  }

  async retrieveBalanced(
    repositoryId: string,
    query: string,
    topK: number = 5
  ): Promise<PrioritizedChunk[]> {
    // Get a mix of chunk types
    const [functions, classes, modules] = await Promise.all([
      this.retrievalPipeline.retrieveByType(query, repositoryId, "function", 3),
      this.retrievalPipeline.retrieveByType(query, repositoryId, "class", 3),
      this.retrievalPipeline.retrieveByType(query, repositoryId, "module", 2),
    ]);

    // Combine and score
    const allChunks = [
      ...functions.map((c) => ({ ...c, type: "function" as const })),
      ...classes.map((c) => ({ ...c, type: "class" as const })),
      ...modules.map((c) => ({ ...c, type: "module" as const })),
    ];

    const prioritized = allChunks.map((chunk) =>
      this.calculatePriorityScore(chunk, {
        prioritizeComplexity: true,
        prioritizeDependencies: true,
        preferFunctions: false,
        preferClasses: false,
      })
    );

    // Deduplicate and sort
    const unique = this.deduplicate(prioritized);
    unique.sort((a, b) => b.priorityScore - a.priorityScore);

    return unique.slice(0, topK);
  }

  private calculatePriorityScore(
    chunk: RetrievedChunk,
    options: {
      prioritizeComplexity: boolean;
      prioritizeDependencies: boolean;
      preferFunctions: boolean;
      preferClasses: boolean;
    }
  ): PrioritizedChunk {
    const relevance = chunk.relevanceScore;
    const complexity = this.extractComplexity(chunk.content);
    const dependencies = this.extractDependencies(chunk.content);

    let complexityScore = 0;
    if (options.prioritizeComplexity) {
      complexityScore = Math.min(1, complexity / 10);
    }

    let dependencyScore = 0;
    if (options.prioritizeDependencies) {
      dependencyScore = Math.min(1, dependencies / 5);
    }

    let typeBonus = 0;
    if (options.preferFunctions && chunk.type === "function") {
      typeBonus = 0.2;
    }
    if (options.preferClasses && chunk.type === "class") {
      typeBonus = 0.2;
    }

    const priorityScore =
      relevance * 0.5 +
      complexityScore * 0.25 +
      dependencyScore * 0.15 +
      typeBonus;

    return {
      ...chunk,
      priorityScore,
      priorityFactors: {
        relevance,
        complexity: complexityScore,
        dependencies: dependencyScore,
        typeBonus,
      },
    };
  }

  private extractComplexity(content: string): number {
    let complexity = 1;
    const keywords = ["if", "else", "for", "while", "switch", "case", "catch", "try"];
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      const matches = content.match(regex);
      complexity += matches?.length || 0;
    }
    return complexity;
  }

  private extractDependencies(content: string): number {
    const importMatches = content.match(/import\s+.*?from\s+['"]/g);
    const requireMatches = content.match(/require\s*\(/g);
    return (importMatches?.length || 0) + (requireMatches?.length || 0);
  }

  private deduplicate(chunks: PrioritizedChunk[]): PrioritizedChunk[] {
    const seen = new Set<string>();
    return chunks.filter((chunk) => {
      if (seen.has(chunk.name)) {
        return false;
      }
      seen.add(chunk.name);
      return true;
    });
  }
}

let instance: PriorityRetrieval | null = null;

export function getPriorityRetrieval(): PriorityRetrieval {
  if (!instance) {
    instance = new PriorityRetrieval();
  }
  return instance;
}
