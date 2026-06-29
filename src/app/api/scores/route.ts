import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo
const scores = new Map<string, unknown>();

export async function GET() {
  const scoreList = Array.from(scores.values());
  return NextResponse.json({ scores: scoreList });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, examId, overallScore, breakdown, feedback } = body;

    if (!id || !examId || overallScore === undefined) {
      return NextResponse.json(
        { error: "id, examId, and overallScore are required" },
        { status: 400 }
      );
    }

    const score = {
      id,
      examId,
      overallScore,
      breakdown: breakdown || {},
      feedback: feedback || "",
      createdAt: new Date().toISOString(),
    };

    scores.set(id, score);
    return NextResponse.json({ score }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create score" },
      { status: 500 }
    );
  }
}
