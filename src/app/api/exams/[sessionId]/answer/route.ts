import { NextRequest, NextResponse } from "next/server";
import { getExamLoop, type ExamSessionData } from "@/backend/examination/exam-loop";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { answer, session: sessionData } = body;

    if (!answer || typeof answer !== "string") {
      return NextResponse.json(
        { error: "answer is required" },
        { status: 400 }
      );
    }

    const examLoop = getExamLoop();

    // Try to get session from store first, fall back to client-provided data
    let session = await examLoop.getSession(sessionId);
    if (!session && sessionData) {
      // Reconstruct session from client-provided data (Vercel serverless workaround)
      session = await examLoop.restoreSession(sessionId, sessionData);
    }

    if (!session) {
      return NextResponse.json(
        { error: "Session not found. Please restart the exam." },
        { status: 404 }
      );
    }

    const result = await examLoop.submitAnswer(sessionId, answer);

    // Return updated session state so client can persist it
    const updatedSession = await examLoop.getSession(sessionId);

    return NextResponse.json({
      evaluation: result.evaluation,
      followUp: result.followUp,
      isComplete: result.isComplete,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Failed to submit answer:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to submit answer", detail: message },
      { status: 500 }
    );
  }
}
