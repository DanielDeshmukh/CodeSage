import type { NormalizedChunk } from "./normalizer";

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  halsteadVolume?: number;
  maintainabilityIndex: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export class ComplexityScorer {
  calculate(chunk: NormalizedChunk): ComplexityMetrics {
    const cyclomatic = this.calculateCyclomatic(chunk.content, chunk.language);
    const cognitive = this.calculateCognitive(chunk.content, chunk.language);
    const maintainability = this.calculateMaintainability(
      chunk.lineCount,
      cyclomatic,
      chunk.complexity
    );
    const riskLevel = this.determineRiskLevel(cyclomatic, cognitive);

    return {
      cyclomatic,
      cognitive,
      maintainabilityIndex: maintainability,
      riskLevel,
    };
  }

  calculateBatch(chunks: NormalizedChunk[]): Map<string, ComplexityMetrics> {
    const results = new Map<string, ComplexityMetrics>();
    for (const chunk of chunks) {
      results.set(chunk.id, this.calculate(chunk));
    }
    return results;
  }

  private calculateCyclomatic(content: string, language: string): number {
    let complexity = 1;
    const keywords = this.getDecisionKeywords(language);

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      const matches = content.match(regex);
      complexity += matches?.length || 0;
    }

    // Count ternary operators
    const ternaryMatches = content.match(/\?[^?:]+:/g);
    complexity += ternaryMatches?.length || 0;

    // Count logical operators
    const andMatches = content.match(/&&/g);
    complexity += andMatches?.length || 0;
    const orMatches = content.match(/\|\|/g);
    complexity += orMatches?.length || 0;

    return complexity;
  }

  private calculateCognitive(content: string, language: string): number {
    let complexity = 0;
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Nesting depth increases cognitive load
      const nesting = this.calculateNestingDepth(trimmed, language);
      complexity += nesting;

      // Long lines increase cognitive load
      if (trimmed.length > 80) {
        complexity += 1;
      }

      // Multiple assignments
      const assignments = trimmed.match(/=/g);
      if (assignments && assignments.length > 2) {
        complexity += 1;
      }
    }

    return complexity;
  }

  private calculateNestingDepth(line: string, language: string): number {
    let depth = 0;
    const openers = ["{", "(", "["];
    const closers = ["}", ")", "]"];

    for (const char of line) {
      if (openers.includes(char)) depth++;
      if (closers.includes(char)) depth--;
    }

    return Math.max(0, depth);
  }

  private calculateMaintainability(
    lineCount: number,
    cyclomatic: number,
    complexity: number
  ): number {
    // Simplified maintainability index
    // Based on Microsoft's maintainability index formula
    const volume = lineCount * Math.log2(lineCount + 1);
    const rawMi = 171 - 5.2 * Math.log(volume) - 0.23 * cyclomatic - 16.2 * Math.log(lineCount);
    return Math.max(0, Math.min(100, rawMi));
  }

  private determineRiskLevel(
    cyclomatic: number,
    cognitive: number
  ): "low" | "medium" | "high" | "critical" {
    if (cyclomatic <= 5 && cognitive <= 10) return "low";
    if (cyclomatic <= 10 && cognitive <= 20) return "medium";
    if (cyclomatic <= 20 && cognitive <= 40) return "high";
    return "critical";
  }

  private getDecisionKeywords(language: string): string[] {
    const common = ["if", "else", "for", "while", "switch", "case", "catch"];
    const languageSpecific: Record<string, string[]> = {
      python: ["elif", "except", "with", "and", "or", "not"],
      java: ["catch", "finally"],
      typescript: ["catch", "finally"],
      javascript: ["catch", "finally"],
    };

    return [...common, ...(languageSpecific[language] || [])];
  }

  getRiskDescription(riskLevel: string): string {
    const descriptions: Record<string, string> = {
      low: "Simple, easy to understand and maintain",
      moderate: "Moderate complexity, may need some attention",
      high: "Complex code, consider refactoring",
      critical: "Very complex, high risk of bugs, needs refactoring",
    };
    return descriptions[riskLevel] || "Unknown risk level";
  }
}

let instance: ComplexityScorer | null = null;

export function getComplexityScorer(): ComplexityScorer {
  if (!instance) {
    instance = new ComplexityScorer();
  }
  return instance;
}
