import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo (will be replaced with database)
const repositories = new Map<string, unknown>();

export async function GET() {
  const repos = Array.from(repositories.values());
  return NextResponse.json({ repositories: repos });
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

    repositories.set(id, repo);
    return NextResponse.json({ repository: repo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create repository" },
      { status: 500 }
    );
  }
}
