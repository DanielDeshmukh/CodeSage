import { NextResponse } from "next/server";
import { isDatabaseAvailable, queryOne } from "@/lib/database/client";

export async function GET() {
  const dbAvailable = isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json({
      status: "degraded",
      database: "not_configured",
      message: "DATABASE_URL not set, using in-memory storage",
    });
  }

  try {
    const result = await queryOne<{ now: string }>("SELECT NOW() as now");
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: result?.now,
    });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      database: "connection_failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
