import { NextRequest, NextResponse } from "next/server";
import { getExamSessionManager } from "@/backend/examination/session";
import { getScoreReportGenerator } from "@/backend/reports/score-report";
import { getStudyGuideGenerator } from "@/backend/reports/study-guide";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeStudyGuide = searchParams.get("studyGuide") === "true";

    const sessionManager = getExamSessionManager();
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "completed") {
      return NextResponse.json(
        { error: "Session is not completed" },
        { status: 400 }
      );
    }

    // Generate score report
    const reportGenerator = getScoreReportGenerator();
    const report = reportGenerator.generate(session);

    // Optionally generate study guide
    let studyGuide = null;
    if (includeStudyGuide) {
      const studyGuideGenerator = getStudyGuideGenerator();
      studyGuide = await studyGuideGenerator.generate(session);
    }

    return NextResponse.json({
      report,
      studyGuide,
    });
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
