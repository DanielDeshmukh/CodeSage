import { getSafetyService, type SafetyResult } from "@/ai/nim/safety";

export interface SafetyFilterResult {
  isSafe: boolean;
  results: Map<
    string,
    {
      filePath: string;
      safety: SafetyResult;
    }
  >;
  unsafeCount: number;
  safeCount: number;
  flaggedCategories: string[];
}

export class SafetyPreFilter {
  private safetyService = getSafetyService();

  async filterFiles(
    files: Array<{ id: string; path: string; content: string }>
  ): Promise<SafetyFilterResult> {
    const results = new Map<
      string,
      { filePath: string; safety: SafetyResult }
    >();
    const flaggedCategories = new Set<string>();

    // Process files in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (file) => {
          const safetyResult = await this.safetyService.checkContent({
            content: file.content,
            context: "code-content",
          });

          results.set(file.id, {
            filePath: file.path,
            safety: safetyResult,
          });

          safetyResult.flaggedCategories.forEach((cat) =>
            flaggedCategories.add(cat)
          );
        })
      );
    }

    const safeCount = Array.from(results.values()).filter(
      (r) => r.safety.isSafe
    ).length;

    return {
      isSafe: safeCount === files.length,
      results,
      unsafeCount: files.length - safeCount,
      safeCount,
      flaggedCategories: Array.from(flaggedCategories),
    };
  }

  async filterCodeChunks(
    chunks: Array<{ id: string; filePath: string; code: string }>
  ): Promise<
    Array<{ id: string; filePath: string; code: string; isSafe: boolean }>
  > {
    const results = await this.filterFiles(
      chunks.map((c) => ({
        id: c.id,
        path: c.filePath,
        content: c.code,
      }))
    );

    return chunks.map((chunk) => ({
      ...chunk,
      isSafe: results.results.get(chunk.id)?.safety.isSafe ?? true,
    }));
  }

  getStats(result: SafetyFilterResult): {
    totalFiles: number;
    safeFiles: number;
    unsafeFiles: number;
    safetyPercentage: number;
  } {
    const total = result.safeCount + result.unsafeCount;
    return {
      totalFiles: total,
      safeFiles: result.safeCount,
      unsafeFiles: result.unsafeCount,
      safetyPercentage: total > 0 ? (result.safeCount / total) * 100 : 100,
    };
  }
}

let instance: SafetyPreFilter | null = null;

export function getSafetyPreFilter(): SafetyPreFilter {
  if (!instance) {
    instance = new SafetyPreFilter();
  }
  return instance;
}
