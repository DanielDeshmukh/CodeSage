import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/database/client";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "codesage",
    version: "0.1.0",
    database: isDatabaseAvailable() ? "connected" : "not_configured",
    timestamp: new Date().toISOString(),
  });
}
