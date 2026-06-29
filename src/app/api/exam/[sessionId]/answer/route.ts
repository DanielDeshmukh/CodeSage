import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getQuestion,
  createAnswer,
  updateAnswerEvaluation,
  updateSessionStatus,
  calculateSessionScores,
} from "@/ai/examiner/session";
import { getAnswerEvaluator } from "@/ai/examiner/evaluator";
import { getIngestionPipeline } from "@/backend/ingestion/pipeline";

// ============================================================================
// POST /api/exam/[sessionId]/answer - Submit an answer
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { questionId, answer: answerContent } = body;

    // Validate required fields
    if (!questionId || !answerContent) {
      return NextResponse.json(
        { error: "questionId and answer are required" },
        { status: 400 }
      );
    }

    // Get session
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Get question
    const question = getQuestion(questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Create answer
    const answer = createAnswer(questionId, answerContent);
    if (!answer) {
      return NextResponse.json(
        { error: "Failed to create answer" },
        { status: 500 }
      );
    }

    // Get code context for evaluation
    let codeContext = "";
    try {
      const pipeline = getIngestionPipeline();
      const searchResults = await pipeline.searchRepository(
        session.repositoryId,
        question.functionName || question.filePath,
        { limit: 3 }
      );
      codeContext = searchResults.map((r) => r.chunk.content).join("\n\n");
    } catch (error) {
      console.error("Failed to fetch code context:", error);
      codeContext = "Code context unavailable";
    }

    // Evaluate answer
    const evaluator = getAnswerEvaluator();
    const { evaluation } = await evaluator.evaluate(
      question.question,
      answerContent,
      codeContext,
      session.mode
    );

    // Update answer with evaluation
    updateAnswerEvaluation(answer.id, evaluation);

    // Update session scores
    calculateSessionScores(sessionId);

    // Check if all questions have been answered
    const allAnswered = session.questions.every((q) => q.answer !== null);
    if (allAnswered) {
      updateSessionStatus(sessionId, "completed");
    }

    // Get updated question
    const updatedQuestion = getQuestion(questionId);

    return NextResponse.json({
      answer: updatedQuestion?.answer,
      scores: session.scores,
      isComplete: allAnswered,
    });
  } catch (error) {
    console.error("Answer submission failed:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
