import { query, queryOne, execute } from "./client";
import type { ExamMode, Difficulty } from "@/backend/examination/session";

export interface SessionRow {
  id: string;
  repository_id: string;
  mode: string;
  difficulty: string;
  status: string;
  total_score: number;
  max_total_score: number;
  questions: any[];
  answers: any[];
  evaluations: any[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepositoryRow {
  id: string;
  github_url: string;
  name: string;
  owner: string;
  status: string;
  language_stats: Record<string, number>;
  total_chunks: number;
  ingested_at: string | null;
  created_at: string;
  updated_at: string;
}

export class SessionRepository {
  async createSession(data: {
    id: string;
    repositoryId: string;
    mode: ExamMode;
    difficulty: Difficulty;
  }): Promise<SessionRow> {
    await execute(
      `INSERT INTO exam_sessions (id, repository_id, mode, difficulty)
       VALUES ($1, $2, $3, $4)`,
      [data.id, data.repositoryId, data.mode, data.difficulty]
    );
    return (await this.getSession(data.id))!;
  }

  async getSession(id: string): Promise<SessionRow | null> {
    return queryOne<SessionRow>(
      "SELECT * FROM exam_sessions WHERE id = $1",
      [id]
    );
  }

  async updateSession(
    id: string,
    data: Partial<{
      status: string;
      total_score: number;
      max_total_score: number;
      questions: any[];
      answers: any[];
      evaluations: any[];
      started_at: string;
      completed_at: string;
    }>
  ): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sets.push(`${key} = $${idx}`);
        values.push(typeof value === "object" ? JSON.stringify(value) : value);
        idx++;
      }
    }

    if (sets.length === 0) return;

    sets.push(`updated_at = NOW()`);
    values.push(id);

    await execute(
      `UPDATE exam_sessions SET ${sets.join(", ")} WHERE id = $${idx}`,
      values
    );
  }

  async getSessionsByRepository(
    repositoryId: string
  ): Promise<SessionRow[]> {
    return query<SessionRow>(
      "SELECT * FROM exam_sessions WHERE repository_id = $1 ORDER BY created_at DESC",
      [repositoryId]
    );
  }

  async deleteSession(id: string): Promise<void> {
    await execute("DELETE FROM exam_sessions WHERE id = $1", [id]);
  }

  async createRepository(data: {
    id: string;
    githubUrl: string;
    name: string;
    owner: string;
  }): Promise<RepositoryRow> {
    await execute(
      `INSERT INTO repositories (id, github_url, name, owner)
       VALUES ($1, $2, $3, $4)`,
      [data.id, data.githubUrl, data.name, data.owner]
    );
    return (await this.getRepository(data.id))!;
  }

  async getRepository(id: string): Promise<RepositoryRow | null> {
    return queryOne<RepositoryRow>(
      "SELECT * FROM repositories WHERE id = $1",
      [id]
    );
  }

  async updateRepository(
    id: string,
    data: Partial<{
      status: string;
      language_stats: Record<string, number>;
      total_chunks: number;
      ingested_at: string;
    }>
  ): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sets.push(`${key} = $${idx}`);
        values.push(typeof value === "object" ? JSON.stringify(value) : value);
        idx++;
      }
    }

    if (sets.length === 0) return;

    sets.push(`updated_at = NOW()`);
    values.push(id);

    await execute(
      `UPDATE repositories SET ${sets.join(", ")} WHERE id = $${idx}`,
      values
    );
  }

  async getRecentSessions(limit: number = 10): Promise<SessionRow[]> {
    return query<SessionRow>(
      "SELECT * FROM exam_sessions ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
  }
}
