import { type ParsedChunk } from "./parser";

export interface NormalizedChunk {
  id: string;
  type: "function" | "class" | "module" | "config" | "documentation";
  name: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  language: string;
  calls: string[];
  calledBy: string[];
  complexity: number;
  hasTodos: boolean;
  dependencyCount: number;
  summary: string | null;
  embedding: number[] | null;
  metadata: {
    isExported: boolean;
    isAsync: boolean;
    hasDocstring: boolean;
    parameterCount: number;
    returnStatements: number;
  };
}

export class ChunkNormalizer {
  normalize(chunks: ParsedChunk[], filePath: string): NormalizedChunk[] {
    return chunks.map((chunk, index) => this.normalizeChunk(chunk, filePath, index));
  }

  private normalizeChunk(
    chunk: ParsedChunk,
    filePath: string,
    index: number
  ): NormalizedChunk {
    const content = chunk.content;
    const lines = content.split("\n");

    return {
      id: this.generateId(filePath, chunk.name, index),
      type: chunk.type,
      name: chunk.name,
      content: chunk.content,
      filePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      lineCount: chunk.endLine - chunk.startLine + 1,
      language: chunk.language,
      calls: [...new Set(chunk.calls)],
      calledBy: [],
      complexity: chunk.complexity,
      hasTodos: chunk.hasTodos,
      dependencyCount: this.countDependencies(content, chunk.language),
      summary: null,
      embedding: null,
      metadata: {
        isExported: this.detectExport(content, chunk.language),
        isAsync: this.detectAsync(content, chunk.language),
        hasDocstring: this.detectDocstring(content, chunk.language),
        parameterCount: this.countParameters(content, chunk.language),
        returnStatements: this.countReturns(content, chunk.language),
      },
    };
  }

  private generateId(filePath: string, name: string, index: number): string {
    const hash = `${filePath}:${name}:${index}`;
    let h = 0;
    for (let i = 0; i < hash.length; i++) {
      h = (h << 5) - h + hash.charCodeAt(i);
      h = h & h;
    }
    return `chunk-${Math.abs(h).toString(36)}`;
  }

  private countDependencies(content: string, language: string): number {
    let count = 0;

    if (language === "typescript" || language === "javascript") {
      const importMatches = content.match(/import\s+.*?from\s+['"]/g);
      count += importMatches?.length || 0;
      const requireMatches = content.match(/require\s*\(/g);
      count += requireMatches?.length || 0;
    } else if (language === "python") {
      const importMatches = content.match(/^(?:import|from)\s+/gm);
      count += importMatches?.length || 0;
    } else if (language === "java") {
      const importMatches = content.match(/^import\s+/gm);
      count += importMatches?.length || 0;
    }

    return count;
  }

  private detectExport(content: string, language: string): boolean {
    if (language === "typescript" || language === "javascript") {
      return /export\s+(?:default\s+)?(?:function|class|const|let|var)/.test(content);
    }
    return false;
  }

  private detectAsync(content: string, language: string): boolean {
    if (language === "typescript" || language === "javascript" || language === "python") {
      return /\basync\b/.test(content);
    }
    return false;
  }

  private detectDocstring(content: string, language: string): boolean {
    if (language === "python") {
      return /"""[\s\S]*?"""|'''[\s\S]*?'''/.test(content);
    }
    if (language === "typescript" || language === "javascript" || language === "java") {
      return /\/\*\*[\s\S]*?\*\//.test(content);
    }
    return false;
  }

  private countParameters(content: string, language: string): number {
    const paramMatch = content.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1].trim()) return 0;
    return paramMatch[1].split(",").length;
  }

  private countReturns(content: string, language: string): number {
    const returnMatches = content.match(/\breturn\b/g);
    return returnMatches?.length || 0;
  }

  mergeChunks(chunks: NormalizedChunk[]): NormalizedChunk[] {
    const byFile = new Map<string, NormalizedChunk[]>();

    for (const chunk of chunks) {
      const key = chunk.id.split(":").slice(0, 2).join(":");
      if (!byFile.has(key)) {
        byFile.set(key, []);
      }
      byFile.get(key)!.push(chunk);
    }

    const merged: NormalizedChunk[] = [];
    for (const fileChunks of byFile.values()) {
      merged.push(...fileChunks);
    }

    return merged;
  }

  buildCallGraph(chunks: NormalizedChunk[]): NormalizedChunk[] {
    const nameToChunk = new Map<string, NormalizedChunk>();
    for (const chunk of chunks) {
      nameToChunk.set(chunk.name, chunk);
    }

    for (const chunk of chunks) {
      for (const call of chunk.calls) {
        const calledChunk = nameToChunk.get(call);
        if (calledChunk && !calledChunk.calledBy.includes(chunk.name)) {
          calledChunk.calledBy.push(chunk.name);
        }
      }
    }

    return chunks;
  }
}

let instance: ChunkNormalizer | null = null;

export function getChunkNormalizer(): ChunkNormalizer {
  if (!instance) {
    instance = new ChunkNormalizer();
  }
  return instance;
}
