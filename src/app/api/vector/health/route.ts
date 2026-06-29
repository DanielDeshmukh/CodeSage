import { NextResponse } from "next/server";
import { getQdrantClient } from "@/backend/vector/qdrant";

export async function GET() {
  try {
    const client = getQdrantClient();
    const info = await client.getCollectionInfo();

    return NextResponse.json({
      status: "healthy",
      collection: "code_chunks",
      pointsCount: info.pointsCount,
      vectorsSize: info.vectorsSize,
      collectionStatus: info.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
