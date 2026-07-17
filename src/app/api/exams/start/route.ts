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
    console.log(`[ExamStart] Starting exam for repo=${repositoryId}, mode=${mode}`);
    const startTime = Date.now();
    const session = await examLoop.startExam({
      repositoryId,
      mode,
      difficulty: difficulty || "intermediate",
      questionCount: questionCount || 1,
      timeLimitMs: timeLimitMs || 1800000,
    });
    console.log(`[ExamStart] Exam started in ${Date.now() - startTime}ms, questions=${session.questions.length}`);

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      questions: session.questions,
      timeLimitMs: session.timeLimitMs,
    });
  } catch (error) {
    console.error("Failed to start exam:", error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("Exam start stack:", stack);
    return NextResponse.json(
      { error: "Failed to start exam", detail: message },
      { status: 500 }
    );
  }
}
