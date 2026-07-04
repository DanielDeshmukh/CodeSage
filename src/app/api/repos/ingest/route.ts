import { NextRequest, NextResponse } from "next/server";
import { getIngestionOrchestrator } from "@/backend/ingestion/orchestrator";
import { getRepoStore } from "@/lib/repo-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "repoUrl is required" },
        { status: 400 }
      );
    }

    // Validate GitHub URL
    const githubUrlPattern =
      /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/;
    if (!githubUrlPattern.test(repoUrl)) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }

    const orchestrator = getIngestionOrchestrator();

    // Start ingestion (non-blocking for SSE)
    const result = await orchestrator.ingest(repoUrl);

    // Store repo in shared in-memory store so it appears in GET /api/repos
    if (result.success && result.repositoryId) {
      const name = repoUrl.split("/").slice(-2).join("/");
      const store = getRepoStore();
      store.set(result.repositoryId, {
        id: result.repositoryId,
        name,
        url: repoUrl,
        stats: result.stats || {},
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: result.success,
      repositoryId: result.repositoryId,
      stats: result.stats,
      error: result.error,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
