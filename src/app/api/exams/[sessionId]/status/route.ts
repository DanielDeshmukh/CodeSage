import { NextRequest, NextResponse } from "next/server";
import { getExamLoop } from "@/backend/examination/exam-loop";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const examLoop = getExamLoop();
    const status = examLoop.getExamStatus(sessionId);

    if (!status) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to get exam status:", error);
    return NextResponse.json(
      { error: "Failed to get exam status" },
      { status: 500 }
    );
  }
}
