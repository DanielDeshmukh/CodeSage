import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  calculateSessionScores,
  getQuestionScores,
  generateStudyGuide,
} from "@/ai/examiner/session";
import type { ScoreReport } from "@/types";

// ============================================================================
// GET /api/exam/[sessionId]/score - Get score report
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Get session
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Calculate scores
    const scores = calculateSessionScores(sessionId);
    if (!scores) {
      return NextResponse.json(
        { error: "Failed to calculate scores" },
        { status: 500 }
      );
    }

    // Get question breakdown
    const questionBreakdown = getQuestionScores(sessionId);

    // Generate study guide
    const studyGuide = generateStudyGuide(sessionId);

    // Create score report
    const report: ScoreReport = {
      id: `report-${sessionId}`,
      sessionId,
      repositoryId: session.repositoryId,
      scores,
      questionBreakdown,
      studyGuide,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Score report generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate score report" },
      { status: 500 }
    );
  }
}
