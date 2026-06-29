import type { NormalizedChunk } from "./normalizer";

export interface CallGraphNode {
  id: string;
  name: string;
  type: string;
  language: string;
  filePath: string;
}

export interface CallGraphEdge {
  source: string;
  target: string;
  type: "calls" | "extends" | "implements" | "imports";
}

export interface CallGraph {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgEdgesPerNode: number;
    mostCalled: string[];
    mostCalling: string[];
  };
}

export class CallGraphBuilder {
  build(chunks: NormalizedChunk[]): CallGraph {
    const nodes = this.buildNodes(chunks);
    const edges = this.buildEdges(chunks);
    const stats = this.calculateStats(nodes, edges);

    return { nodes, edges, stats };
  }

  getDependents(chunks: NormalizedChunk[], chunkName: string): NormalizedChunk[] {
    return chunks.filter((c) => c.calls.includes(chunkName));
  }

  getDependencies(chunks: NormalizedChunk[], chunkName: string): NormalizedChunk[] {
    const chunk = chunks.find((c) => c.name === chunkName);
    if (!chunk) return [];
    return chunks.filter((c) => chunk.calls.includes(c.name));
  }

  getCallChain(
    chunks: NormalizedChunk[],
    startName: string,
    maxDepth: number = 5
  ): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[], depth: number) => {
      if (depth > maxDepth || visited.has(current)) {
        return;
      }

      visited.add(current);
      path.push(current);

      const chunk = chunks.find((c) => c.name === current);
      if (chunk) {
        for (const call of chunk.calls) {
          dfs(call, [...path], depth + 1);
        }
      }

      if (path.length > 1) {
        chains.push(path);
      }
      visited.delete(current);
    };

    dfs(startName, [], 0);
    return chains;
  }

  findCircularDependencies(chunks: NormalizedChunk[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (current: string, path: string[]) => {
      visited.add(current);
      recursionStack.add(current);
      path.push(current);

      const chunk = chunks.find((c) => c.name === current);
      if (chunk) {
        for (const call of chunk.calls) {
          if (!visited.has(call)) {
            dfs(call, path);
          } else if (recursionStack.has(call)) {
            const cycleStart = path.indexOf(call);
            if (cycleStart !== -1) {
              cycles.push(path.slice(cycleStart));
            }
          }
        }
      }

      path.pop();
      recursionStack.delete(current);
    };

    for (const chunk of chunks) {
      if (!visited.has(chunk.name)) {
        dfs(chunk.name, []);
      }
    }

    return cycles;
  }

  private buildNodes(chunks: NormalizedChunk[]): CallGraphNode[] {
    return chunks.map((chunk) => ({
      id: chunk.id,
      name: chunk.name,
      type: chunk.type,
      language: chunk.language,
      filePath: "",
    }));
  }

  private buildEdges(chunks: NormalizedChunk[]): CallGraphEdge[] {
    const edges: CallGraphEdge[] = [];
    const nodeNames = new Set(chunks.map((c) => c.name));

    for (const chunk of chunks) {
      for (const call of chunk.calls) {
        if (nodeNames.has(call)) {
          edges.push({
            source: chunk.name,
            target: call,
            type: "calls",
          });
        }
      }
    }

    return edges;
  }

  private calculateStats(
    nodes: CallGraphNode[],
    edges: CallGraphEdge[]
  ): CallGraph["stats"] {
    const outDegree = new Map<string, number>();
    const inDegree = new Map<string, number>();

    for (const edge of edges) {
      outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const mostCalled = Array.from(inDegree.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const mostCalling = Array.from(outDegree.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgEdgesPerNode: nodes.length > 0 ? edges.length / nodes.length : 0,
      mostCalled,
      mostCalling,
    };
  }
}

let instance: CallGraphBuilder | null = null;

export function getCallGraphBuilder(): CallGraphBuilder {
  if (!instance) {
    instance = new CallGraphBuilder();
  }
  return instance;
}
