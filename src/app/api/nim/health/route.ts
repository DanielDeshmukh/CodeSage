import { NextResponse } from "next/server";
import { getHealthChecker } from "@/ai/nim/health";

export async function GET() {
  try {
    const checker = getHealthChecker();
    const result = await checker.checkAllModels();

    return NextResponse.json({
      status: result.overall ? "healthy" : "degraded",
      models: result.models,
      timestamp: result.timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to perform health check",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
