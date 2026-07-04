import { NextRequest, NextResponse } from "next/server";
import { getScores, addScore } from "@/lib/score-store";

export async function GET() {
  const scores = await getScores();
  return NextResponse.json({ scores });
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

    await addScore(score);
    return NextResponse.json({ score }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create score" },
      { status: 500 }
    );
  }
}
