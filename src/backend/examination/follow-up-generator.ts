import { getNIMClient } from "@/ai/nim/client";
import { NIM_MODELS } from "@/ai/nim/config";
import { getFollowUpPrompt, type PromptContext } from "@/ai/prompts/examiner";

export interface FollowUpResult {
  question: string;
  reason: string;
  focusArea: string;
}

export class FollowUpGenerator {
  private client = getNIMClient();
  private config = NIM_MODELS.examiner;

  async generateFollowUp(
    previousQuestion: string,
    previousAnswer: string,
    context: PromptContext,
    weakAreas?: string[]
  ): Promise<FollowUpResult | null> {
    const prompt = getFollowUpPrompt(
      previousQuestion,
      previousAnswer,
      context
    );

    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer generating follow-up questions. Your goal is to probe deeper into the candidate's understanding by exploring weak areas or related concepts. Be specific and challenging but fair.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          question: parsed.question || "",
          reason: parsed.reason || "Probing deeper understanding",
          focusArea: this.determineFocusArea(weakAreas),
        };
      }
    } catch (error) {
      console.error("Failed to parse follow-up:", error);
    }

    return null;
  }

  async generateProbingFollowUp(
    question: string,
    answer: string,
    score: number,
    context: PromptContext
  ): Promise<FollowUpResult | null> {
    if (score >= 70) {
      return null;
    }

    const weakAreas = this.identifyWeakAreas(answer, score);

    return this.generateFollowUp(question, answer, context, weakAreas);
  }

  private identifyWeakAreas(answer: string, score: number): string[] {
    const areas: string[] = [];

    if (answer.length < 50) {
      areas.push("brevity");
    }
    if (score < 50) {
      areas.push("accuracy");
    }
    if (!answer.includes("because") && !answer.includes("since")) {
      areas.push("reasoning");
    }
    if (!answer.includes("example")) {
      areas.push("examples");
    }

    return areas;
  }

  private determineFocusArea(weakAreas?: string[]): string {
    if (weakAreas && weakAreas.length > 0) {
      return weakAreas[0];
    }
    return "general";
  }
}

let instance: FollowUpGenerator | null = null;

export function getFollowUpGenerator(): FollowUpGenerator {
  if (!instance) {
    instance = new FollowUpGenerator();
  }
  return instance;
}
