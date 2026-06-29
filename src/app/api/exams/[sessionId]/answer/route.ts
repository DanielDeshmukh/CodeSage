import { NextRequest, NextResponse } from "next/server";
import { getExamLoop } from "@/backend/examination/exam-loop";

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await request.json();
    const { answer } = body;

    if (!answer || typeof answer !== "string") {
      return NextResponse.json(
        { error: "answer is required" },
        { status: 400 }
      );
    }

    const examLoop = getExamLoop();
    const result = await examLoop.submitAnswer(sessionId, answer);

    return NextResponse.json({
      evaluation: result.evaluation,
      followUp: result.followUp,
      isComplete: result.isComplete,
    });
  } catch (error) {
    console.error("Failed to submit answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
