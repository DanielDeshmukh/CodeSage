import { getNIMClient } from "@/ai/nim/client";
import { NIM_MODELS } from "@/ai/nim/config";
import type { NormalizedChunk } from "./normalizer";

export interface SummaryOptions {
  maxLength?: number;
  includeKey?: boolean;
}

export class ChunkSummarizer {
  private client = getNIMClient();
  private config = NIM_MODELS.examiner;

  async summarizeChunk(
    chunk: NormalizedChunk,
    options?: SummaryOptions
  ): Promise<string> {
    const prompt = this.buildPrompt(chunk, options);
    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are a technical code summarizer. Generate concise, accurate summaries of code chunks. Focus on purpose, key functionality, and important details. Keep summaries under ${options?.maxLength || 100} words.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 256,
    });

    return response.choices[0].message.content;
  }

  async summarizeBatch(
    chunks: NormalizedChunk[],
    options?: SummaryOptions
  ): Promise<Map<string, string>> {
    const summaries = new Map<string, string>();

    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (chunk) => {
          const summary = await this.summarizeChunk(chunk, options);
          return { id: chunk.id, summary };
        })
      );

      for (const result of results) {
        summaries.set(result.id, result.summary);
      }
    }

    return summaries;
  }

  async enrichWithSummary(chunk: NormalizedChunk): Promise<NormalizedChunk> {
    const summary = await this.summarizeChunk(chunk);
    return { ...chunk, summary };
  }

  async enrichBatch(chunks: NormalizedChunk[]): Promise<NormalizedChunk[]> {
    const summaries = await this.summarizeBatch(chunks);
    return chunks.map((chunk) => ({
      ...chunk,
      summary: summaries.get(chunk.id) || null,
    }));
  }

  private buildPrompt(
    chunk: NormalizedChunk,
    options?: SummaryOptions
  ): string {
    return `Summarize the following ${chunk.type} "${chunk.name}" from ${chunk.filePath || "unknown"}:

\`\`\`${chunk.language}
${chunk.content.slice(0, 2000)}
\`\`\`

Key characteristics:
- Type: ${chunk.type}
- Language: ${chunk.language}
- Lines: ${chunk.lineCount}
- Complexity: ${chunk.complexity}
- Calls: ${chunk.calls.slice(0, 5).join(", ")}

Provide a concise summary (max ${options?.maxLength || 100} words) covering:
1. Purpose and functionality
2. Key parameters/inputs
3. Return value/outputs
4. Important side effects or dependencies`;
  }
}

let instance: ChunkSummarizer | null = null;

export function getChunkSummarizer(): ChunkSummarizer {
  if (!instance) {
    instance = new ChunkSummarizer();
  }
  return instance;
}
