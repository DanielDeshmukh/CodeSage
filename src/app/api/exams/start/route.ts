import { NextRequest, NextResponse } from "next/server";
import { getExamLoop } from "@/backend/examination/exam-loop";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, mode, difficulty, questionCount, timeLimitMs } = body;

    if (!repositoryId || !mode) {
      return NextResponse.json(
        { error: "repositoryId and mode are required" },
        { status: 400 }
      );
    }

    if (!["viva", "interview", "code-review"].includes(mode)) {
      return NextResponse.json(
        { error: "mode must be viva, interview, or code-review" },
        { status: 400 }
      );
    }

    const examLoop = getExamLoop();
    const session = await examLoop.startExam({
      repositoryId,
      mode,
      difficulty: difficulty || "intermediate",
      questionCount: questionCount || 5,
      timeLimitMs: timeLimitMs || 1800000,
    });

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      questions: session.questions,
      timeLimitMs: session.timeLimitMs,
    });
  } catch (error) {
    console.error("Failed to start exam:", error);
    return NextResponse.json(
      { error: "Failed to start exam" },
      { status: 500 }
    );
  }
}
