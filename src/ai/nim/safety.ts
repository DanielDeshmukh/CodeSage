import { getNIMClient, type NIMSafetyResponse } from "./client";
import { NIM_MODELS } from "./config";

export interface SafetyCheckRequest {
  content: string;
  context?: "user-input" | "generated-content" | "code-content";
}

export interface SafetyResult {
  isSafe: boolean;
  safetyLevel: "safe" | "warning" | "unsafe";
  flaggedCategories: string[];
  confidence: number;
  explanation?: string;
}

export class SafetyService {
  private client = getNIMClient();
  private config = NIM_MODELS.safety;

  async checkContent(request: SafetyCheckRequest): Promise<SafetyResult> {
    const response = await this.client.checkSafety({
      messages: [
        {
          role: "user",
          content: this.buildSafetyPrompt(request),
        },
      ],
    });

    return {
      isSafe: response.is_safe,
      safetyLevel: response.safety_rating as "safe" | "warning" | "unsafe",
      flaggedCategories: response.flagged_categories,
      confidence: response.is_safe ? 0.9 : 0.7,
    };
  }

  async checkBatch(
    items: Array<{ id: string; content: string }>
  ): Promise<Map<string, SafetyResult>> {
    const results = new Map<string, SafetyResult>();

    await Promise.all(
      items.map(async (item) => {
        const result = await this.checkContent({
          content: item.content,
          context: "code-content",
        });
        results.set(item.id, result);
      })
    );

    return results;
  }

  async filterUnsafeContent(
    items: Array<{ id: string; content: string }>
  ): Promise<{
    safe: Array<{ id: string; content: string }>;
    unsafe: Array<{ id: string; content: string; reason: string }>;
  }> {
    const safetyResults = await this.checkBatch(items);

    const safe: Array<{ id: string; content: string }> = [];
    const unsafe: Array<{ id: string; content: string; reason: string }> = [];

    items.forEach((item) => {
      const result = safetyResults.get(item.id);
      if (result?.isSafe) {
        safe.push(item);
      } else {
        unsafe.push({
          ...item,
          reason: result?.flaggedCategories.join(", ") || "Content flagged as unsafe",
        });
      }
    });

    return { safe, unsafe };
  }

  private buildSafetyPrompt(request: SafetyCheckRequest): string {
    const contextLabel = request.context || "general";
    return `Analyze the following ${contextLabel} content for safety issues. Check for:
- Harmful or malicious code
- Inappropriate content
- Security vulnerabilities
- Offensive language

Content to analyze:
${request.content.slice(0, 2000)}

Respond with JSON: {"is_safe": boolean, "safety_rating": "safe"|"warning"|"unsafe", "flagged_categories": []}`;
  }
}

let instance: SafetyService | null = null;

export function getSafetyService(): SafetyService {
  if (!instance) {
    instance = new SafetyService();
  }
  return instance;
}
