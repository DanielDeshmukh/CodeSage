import { NextRequest, NextResponse } from "next/server";
import { getRerankerService } from "@/ai/nim/reranker";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, documents, topN } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query string is required" },
        { status: 400 }
      );
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: "documents array is required" },
        { status: 400 }
      );
    }

    if (documents.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 documents per request" },
        { status: 400 }
      );
    }

    const service = getRerankerService();
    const results = await service.rerank(query, documents, { topN });

    return NextResponse.json({
      results,
      query,
      totalDocuments: documents.length,
    });
  } catch (error) {
    console.error("Rerank error:", error);
    return NextResponse.json(
      { error: "Failed to rerank documents" },
      { status: 500 }
    );
  }
}
