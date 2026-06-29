import { NextRequest, NextResponse } from "next/server";
import { getExamLoop } from "@/backend/examination/exam-loop";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const examLoop = getExamLoop();
    const result = await examLoop.completeExam(sessionId);

    return NextResponse.json({
      session: {
        id: result.session.id,
        mode: result.session.mode,
        status: result.session.status,
        totalScore: result.session.totalScore,
        maxTotalScore: result.session.maxTotalScore,
        startedAt: result.session.startedAt,
        completedAt: result.session.completedAt,
      },
      feedback: result.feedback,
      overallScore: result.overallScore,
      dimensionScores: result.dimensionScores,
    });
  } catch (error) {
    console.error("Failed to complete exam:", error);
    return NextResponse.json(
      { error: "Failed to complete exam" },
      { status: 500 }
    );
  }
}
