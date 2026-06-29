import { getNIMClient } from "./client";
import { NIM_MODELS, type NIMModelName } from "./config";

export interface ModelHealthStatus {
  model: NIMModelName;
  isHealthy: boolean;
  latencyMs: number;
  lastChecked: Date;
  error?: string;
}

export interface HealthCheckResult {
  overall: boolean;
  models: ModelHealthStatus[];
  timestamp: Date;
}

export class HealthChecker {
  private client = getNIMClient();
  private cache = new Map<NIMModelName, ModelHealthStatus>();
  private cacheTTL = 60000; // 1 minute

  async checkAllModels(): Promise<HealthCheckResult> {
    const models = Object.keys(NIM_MODELS) as NIMModelName[];
    const results = await Promise.allSettled(
      models.map((model) => this.checkModel(model))
    );

    const modelStatuses = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        model: models[index],
        isHealthy: false,
        latencyMs: 0,
        lastChecked: new Date(),
        error: result.reason?.message || "Unknown error",
      };
    });

    return {
      overall: modelStatuses.every((s) => s.isHealthy),
      models: modelStatuses,
      timestamp: new Date(),
    };
  }

  async checkModel(model: NIMModelName): Promise<ModelHealthStatus> {
    const cached = this.cache.get(model);
    if (cached && Date.now() - cached.lastChecked.getTime() < this.cacheTTL) {
      return cached;
    }

    const startTime = Date.now();
    try {
      await this.client.embed({
        input: ["health check"],
        model: NIM_MODELS[model].id,
      });

      const status: ModelHealthStatus = {
        model,
        isHealthy: true,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
      };

      this.cache.set(model, status);
      return status;
    } catch (error) {
      const status: ModelHealthStatus = {
        model,
        isHealthy: false,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      this.cache.set(model, status);
      return status;
    }
  }

  async getHealthyModel(preferred: NIMModelName): Promise<NIMModelName> {
    const status = await this.checkModel(preferred);
    if (status.isHealthy) {
      return preferred;
    }

    // Fallback to alternative models
    const fallbacks: Record<NIMModelName, NIMModelName[]> = {
      embedding: ["embedding"],
      reranker: ["reranker"],
      examiner: ["examiner", "scorer"],
      scorer: ["scorer", "examiner"],
      safety: ["safety", "examiner"],
    };

    for (const fallback of fallbacks[preferred]) {
      const fallbackStatus = await this.checkModel(fallback);
      if (fallbackStatus.isHealthy) {
        return fallback;
      }
    }

    return preferred;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

let instance: HealthChecker | null = null;

export function getHealthChecker(): HealthChecker {
  if (!instance) {
    instance = new HealthChecker();
  }
  return instance;
}
