import { NextRequest, NextResponse } from "next/server";
import { createSession, getSession } from "@/ai/examiner/session";
import { getIngestionPipeline } from "@/backend/ingestion/pipeline";
import { getQuestionGenerator } from "@/ai/examiner/generator";
import type { ExamMode } from "@/types";

// ============================================================================
// POST /api/exam - Create a new exam session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, repositoryUrl, mode, questionCount } = body;

    // Validate required fields
    if (!repositoryId && !repositoryUrl) {
      return NextResponse.json(
        { error: "Either repositoryId or repositoryUrl is required" },
        { status: 400 }
      );
    }

    if (!mode || !["viva", "interview", "code-review"].includes(mode)) {
      return NextResponse.json(
        { error: "Valid mode is required (viva, interview, code-review)" },
        { status: 400 }
      );
    }

    // Create session
    const session = createSession(
      repositoryId || "temp",
      mode as ExamMode,
      questionCount || 10
    );

    // If repositoryUrl is provided, ingest the repository first
    if (repositoryUrl) {
      const pipeline = getIngestionPipeline();
      const { repository } = await pipeline.ingestRepository(repositoryUrl);
      session.repositoryId = repository.id;
    }

    // Generate questions
    const pipeline = getIngestionPipeline();
    const generator = getQuestionGenerator();

    try {
      // Search for relevant chunks
      const searchResults = await pipeline.searchRepository(
        session.repositoryId,
        "code implementation",
        { limit: 20 }
      );

      const chunks = searchResults.map((r) => r.chunk);

      // Generate questions
      const questions = await generator.generateQuestions(
        chunks,
        mode as ExamMode,
        session.totalQuestions
      );

      // Store questions in session
      const { createQuestion } = await import("@/ai/examiner/session");
      for (const q of questions) {
        createQuestion(
          session.id,
          q.chunkId,
          q.question,
          q.filePath,
          q.functionName,
          q.lineNumber
        );
      }

      // Update session status
      const { updateSessionStatus } = await import("@/ai/examiner/session");
      updateSessionStatus(session.id, "in-progress");

      // Return updated session
      const updatedSession = getSession(session.id);
      return NextResponse.json({ session: updatedSession });
    } catch (error) {
      console.error("Question generation failed:", error);
      // Return session even if question generation fails
      return NextResponse.json({
        session,
        warning: "Question generation failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Exam creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create exam session" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/exam - List all exam sessions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId");

    if (repositoryId) {
      const { getSessionsByRepository } = await import("@/ai/examiner/session");
      const sessions = getSessionsByRepository(repositoryId);
      return NextResponse.json({ sessions });
    }

    // Return all sessions (for demo purposes)
    const { getSession } = await import("@/ai/examiner/session");
    // This would normally query a database
    return NextResponse.json({ sessions: [] });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
