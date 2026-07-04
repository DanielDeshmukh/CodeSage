import { NextRequest, NextResponse } from "next/server";
import { getExam } from "@/lib/exam-store";
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

    const exam = await getExam(sessionId);

    if (!exam) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (exam.status !== "completed") {
      return NextResponse.json(
        { error: "Session is not completed" },
        { status: 400 }
      );
    }

    // Convert exam record to session format for report generator
    const session = {
      id: exam.id,
      repositoryId: exam.repositoryId,
      mode: exam.mode,
      difficulty: exam.difficulty,
      status: exam.status,
      questions: exam.questions,
      answers: exam.answers,
      evaluations: exam.evaluations,
      startedAt: exam.startedAt,
      completedAt: exam.completedAt,
    };

    // Generate score report
    const reportGenerator = getScoreReportGenerator();
    const report = reportGenerator.generate(session as any);

    // Optionally generate study guide
    let studyGuide = null;
    if (includeStudyGuide) {
      const studyGuideGenerator = getStudyGuideGenerator();
      studyGuide = await studyGuideGenerator.generate(session as any);
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
