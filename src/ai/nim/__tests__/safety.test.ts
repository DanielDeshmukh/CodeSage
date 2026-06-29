import { describe, it, expect, vi, beforeEach } from "vitest";
import { SafetyService } from "../safety";

describe("SafetyService", () => {
  let service: SafetyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SafetyService();
  });

  describe("checkContent", () => {
    it("should return safe for safe content", async () => {
      const mockResponse = {
        is_safe: true,
        safety_rating: "safe",
        flagged_categories: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.checkContent({
        content: "This is a normal code review question",
      });

      expect(result.isSafe).toBe(true);
      expect(result.safetyLevel).toBe("safe");
    });

    it("should return unsafe for harmful content", async () => {
      const safetyPayload = {
        is_safe: false,
        safety_rating: "unsafe",
        flagged_categories: ["harmful"],
      };

      const chatResponse = {
        id: "test-id",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: JSON.stringify(safetyPayload) },
            finish_reason: "stop",
          },
        ],
        model: "test-model",
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(chatResponse),
      });

      const result = await service.checkContent({
        content: "Malicious code injection attempt",
      });

      expect(result.isSafe).toBe(false);
      expect(result.flaggedCategories).toContain("harmful");
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        statusText: "Error",
      });

      const result = await service.checkContent({
        content: "Test content",
      });

      expect(result.isSafe).toBe(true);
      expect(result.safetyLevel).toBe("safe");
    });
  });

  describe("filterUnsafeContent", () => {
    it("should separate safe and unsafe items", async () => {
      const mockResponse = {
        is_safe: true,
        safety_rating: "safe",
        flagged_categories: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const items = [
        { id: "1", content: "Safe code 1" },
        { id: "2", content: "Safe code 2" },
      ];

      const result = await service.filterUnsafeContent(items);

      expect(result.safe).toHaveLength(2);
      expect(result.unsafe).toHaveLength(0);
    });
  });
});
