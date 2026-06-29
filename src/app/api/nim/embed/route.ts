import { NextRequest, NextResponse } from "next/server";
import { getEmbeddingService } from "@/ai/nim/embedding";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { texts, options } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "texts array is required" },
        { status: 400 }
      );
    }

    if (texts.length > 128) {
      return NextResponse.json(
        { error: "Maximum 128 texts per request" },
        { status: 400 }
      );
    }

    const service = getEmbeddingService();
    const embeddings = await service.embed(texts, options);

    return NextResponse.json({
      embeddings,
      dimensions: service.getDimensions(),
      count: embeddings.length,
    });
  } catch (error) {
    console.error("Embedding error:", error);
    return NextResponse.json(
      { error: "Failed to generate embeddings" },
      { status: 500 }
    );
  }
}
