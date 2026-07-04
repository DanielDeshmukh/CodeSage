import { NextRequest, NextResponse } from "next/server";
import { getRepos, addRepo } from "@/lib/repo-store";

export async function GET() {
  return NextResponse.json({ repositories: getRepos() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, url, stats } = body;

    if (!id || !name || !url) {
      return NextResponse.json(
        { error: "id, name, and url are required" },
        { status: 400 }
      );
    }

    const repo = {
      id,
      name,
      url,
      stats: stats || {},
      createdAt: new Date().toISOString(),
    };

    addRepo(repo);
    return NextResponse.json({ repository: repo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create repository" },
      { status: 500 }
    );
  }
}
