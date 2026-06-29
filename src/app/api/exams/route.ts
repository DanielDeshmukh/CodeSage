import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo
const exams = new Map<string, unknown>();

export async function GET() {
  const examList = Array.from(exams.values());
  return NextResponse.json({ exams: examList });
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
      startedAt: new Date().toISOString(),
      questions: [],
      answers: [],
    };

    exams.set(id, exam);
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
