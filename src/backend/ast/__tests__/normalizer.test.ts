import { describe, it, expect } from "vitest";
import { ChunkNormalizer, type NormalizedChunk } from "../normalizer";
import type { ParsedChunk } from "../parser";

describe("ChunkNormalizer", () => {
  const normalizer = new ChunkNormalizer();

  describe("normalize", () => {
    it("should normalize parsed chunks", () => {
      const chunks: ParsedChunk[] = [
        {
          type: "function",
          name: "testFunction",
          content: "function test() {}",
          startLine: 1,
          endLine: 1,
          language: "typescript",
          calls: ["console"],
          complexity: 2,
          hasTodos: false,
          dependencyCount: 1,
        },
      ];

      const normalized = normalizer.normalize(chunks, "test.ts");

      expect(normalized).toHaveLength(1);
      expect(normalized[0].id).toBeDefined();
      expect(normalized[0].lineCount).toBe(1);
      expect(normalized[0].metadata).toBeDefined();
    });

    it("should generate unique IDs", () => {
      const chunks: ParsedChunk[] = [
        {
          type: "function",
          name: "func1",
          content: "function func1() {}",
          startLine: 1,
          endLine: 1,
          language: "typescript",
          calls: [],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 0,
        },
        {
          type: "function",
          name: "func2",
          content: "function func2() {}",
          startLine: 3,
          endLine: 3,
          language: "typescript",
          calls: [],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 0,
        },
      ];

      const normalized = normalizer.normalize(chunks, "test.ts");

      expect(normalized[0].id).not.toBe(normalized[1].id);
    });

    it("should deduplicate calls", () => {
      const chunks: ParsedChunk[] = [
        {
          type: "function",
          name: "test",
          content: "test()",
          startLine: 1,
          endLine: 1,
          language: "typescript",
          calls: ["console", "console", "log"],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 0,
        },
      ];

      const normalized = normalizer.normalize(chunks, "test.ts");

      expect(normalized[0].calls).toEqual(["console", "log"]);
    });
  });

  describe("buildCallGraph", () => {
    it("should build call relationships", () => {
      const chunks: NormalizedChunk[] = [
        {
          id: "1",
          type: "function",
          name: "caller",
          content: "caller()",
          startLine: 1,
          endLine: 1,
          lineCount: 1,
          language: "typescript",
          calls: ["callee"],
          calledBy: [],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 1,
          summary: null,
          embedding: null,
          metadata: {
            isExported: false,
            isAsync: false,
            hasDocstring: false,
            parameterCount: 0,
            returnStatements: 0,
          },
        },
        {
          id: "2",
          type: "function",
          name: "callee",
          content: "callee()",
          startLine: 2,
          endLine: 2,
          lineCount: 1,
          language: "typescript",
          calls: [],
          calledBy: [],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 0,
          summary: null,
          embedding: null,
          metadata: {
            isExported: false,
            isAsync: false,
            hasDocstring: false,
            parameterCount: 0,
            returnStatements: 0,
          },
        },
      ];

      const withGraph = normalizer.buildCallGraph(chunks);

      expect(withGraph[1].calledBy).toContain("caller");
    });
  });

  describe("metadata extraction", () => {
    it("should detect async functions", () => {
      const chunks: ParsedChunk[] = [
        {
          type: "function",
          name: "asyncFunc",
          content: "async function fetchData() {}",
          startLine: 1,
          endLine: 1,
          language: "typescript",
          calls: [],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 0,
        },
      ];

      const normalized = normalizer.normalize(chunks, "test.ts");

      expect(normalized[0].metadata.isAsync).toBe(true);
    });

    it("should detect exported functions", () => {
      const chunks: ParsedChunk[] = [
        {
          type: "function",
          name: "exportedFunc",
          content: "export function helper() {}",
          startLine: 1,
          endLine: 1,
          language: "typescript",
          calls: [],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 0,
        },
      ];

      const normalized = normalizer.normalize(chunks, "test.ts");

      expect(normalized[0].metadata.isExported).toBe(true);
    });

    it("should count parameters", () => {
      const chunks: ParsedChunk[] = [
        {
          type: "function",
          name: "multiParam",
          content: "function test(a, b, c) {}",
          startLine: 1,
          endLine: 1,
          language: "typescript",
          calls: [],
          complexity: 1,
          hasTodos: false,
          dependencyCount: 0,
        },
      ];

      const normalized = normalizer.normalize(chunks, "test.ts");

      expect(normalized[0].metadata.parameterCount).toBe(3);
    });
  });
});
