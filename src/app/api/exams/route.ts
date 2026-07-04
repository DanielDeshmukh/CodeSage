import { NextRequest, NextResponse } from "next/server";
import { getExams, addExam } from "@/lib/exam-store";

export async function GET() {
  const exams = await getExams();
  return NextResponse.json({ exams });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, repositoryId, mode, difficulty } = body;

    if (!id || !repositoryId || !mode) {
      return NextResponse.json(
        { error: "id, repositoryId, and mode are required" },
        { status: 400 }
      );
    }

    const exam = {
      id,
      repositoryId,
      mode,
      difficulty: difficulty || "intermediate",
      status: "in_progress",
      totalScore: 0,
      maxTotalScore: 0,
      questions: [],
      answers: [],
      evaluations: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    await addExam(exam);
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
