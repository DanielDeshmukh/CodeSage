import { describe, it, expect } from "vitest";
import { ComplexityScorer } from "../complexity";
import type { NormalizedChunk } from "../normalizer";

describe("ComplexityScorer", () => {
  const scorer = new ComplexityScorer();

  const createChunk = (
    content: string,
    language: string = "typescript"
  ): NormalizedChunk => ({
    id: "test",
    type: "function",
    name: "test",
    content,
    startLine: 1,
    endLine: 1,
    lineCount: 1,
    language,
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
  });

  describe("calculate", () => {
    it("should calculate cyclomatic complexity", () => {
      const chunk = createChunk(`
        if (x > 0) {
          for (let i = 0; i < x; i++) {
            while (true) {
              break;
            }
          }
        }
      `);

      const metrics = scorer.calculate(chunk);

      expect(metrics.cyclomatic).toBeGreaterThan(1);
    });

    it("should calculate cognitive complexity", () => {
      const chunk = createChunk(`
        function deep() {
          if (a) {
            if (b) {
              if (c) {
                return 1;
              }
            }
          }
        }
      `);

      const metrics = scorer.calculate(chunk);

      expect(metrics.cognitive).toBeGreaterThan(0);
    });

    it("should determine low risk level", () => {
      const chunk = createChunk(`
        function simple() {
          return 1;
        }
      `);

      const metrics = scorer.calculate(chunk);

      expect(metrics.riskLevel).toBe("low");
    });

    it("should determine high risk level", () => {
      const chunk = createChunk(`
        function complex(a, b, c) {
          if (a > 0) {
            for (let i = 0; i < a; i++) {
              if (b > 0) {
                while (c > 0) {
                  switch (c) {
                    case 1:
                      try {
                        if (i > 0) {
                          return 1;
                        }
                      } catch (e) {
                        return 2;
                      }
                  }
                }
              }
            }
          }
          return 0;
        }
      `);

      const metrics = scorer.calculate(chunk);

      expect(metrics.riskLevel).toBe("high");
    });

    it("should calculate maintainability index", () => {
      const chunk = createChunk(`
        function moderate() {
          if (x) return 1;
          return 0;
        }
      `);

      const metrics = scorer.calculate(chunk);

      expect(metrics.maintainabilityIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.maintainabilityIndex).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateBatch", () => {
    it("should process multiple chunks", () => {
      const chunks = [
        createChunk("function a() {}"),
        createChunk("function b() { if (x) {} }"),
        createChunk("function c() { for (let i=0; i<10; i++) {} }"),
      ];

      const results = scorer.calculateBatch(chunks);

      expect(results.size).toBe(3);
    });
  });

  describe("getRiskDescription", () => {
    it("should return descriptions for risk levels", () => {
      expect(scorer.getRiskDescription("low")).toContain("Simple");
      expect(scorer.getRiskDescription("high")).toContain("Complex");
      expect(scorer.getRiskDescription("critical")).toContain("Very complex");
    });
  });
});
