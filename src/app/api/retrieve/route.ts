import { NextRequest, NextResponse } from "next/server";
import { getRetrievalPipeline } from "@/backend/vector/retrieval";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, query, topK, rerankTopN, filter } = body;

    if (!repositoryId || !query) {
      return NextResponse.json(
        { error: "repositoryId and query are required" },
        { status: 400 }
      );
    }

    const pipeline = getRetrievalPipeline();
    const result = await pipeline.retrieve({
      repositoryId,
      query,
      topK: topK || 5,
      rerankTopN: rerankTopN || 3,
      filter,
    });

    return NextResponse.json({
      chunks: result.chunks,
      query: result.query,
      totalCandidates: result.totalCandidates,
      finalResults: result.finalResults,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error("Retrieval error:", error);
    return NextResponse.json(
      { error: "Retrieval failed" },
      { status: 500 }
    );
  }
}
