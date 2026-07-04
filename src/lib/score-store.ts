import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { isDatabaseAvailable, query, execute } from "./database/client";

const DATA_PATH = join(process.cwd(), ".score-store.json");

export interface ScoreRecord {
  id: string;
  examId: string;
  overallScore: number;
  breakdown: Record<string, number>;
  feedback: string;
  createdAt: string;
}

// --- JSON file fallback ---

function loadFile(): ScoreRecord[] {
  try {
    if (existsSync(DATA_PATH)) {
      return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

function saveFile(scores: ScoreRecord[]) {
  writeFileSync(DATA_PATH, JSON.stringify(scores, null, 2));
}

// --- PostgreSQL (store in exam_sessions table via total_score) ---

// Scores are stored as part of the exam session, but we keep this
// for backward compatibility with the existing API

// --- Public API ---

export async function getScores(): Promise<ScoreRecord[]> {
  if (isDatabaseAvailable()) {
    try {
      const rows = await query<{
        id: string;
        repository_id: string;
        mode: string;
        total_score: number;
        max_total_score: number;
        completed_at: string | null;
      }>(
        "SELECT id, repository_id, mode, total_score, max_total_score, completed_at FROM exam_sessions WHERE status = 'completed' ORDER BY completed_at DESC"
      );

      return rows.map((r) => ({
        id: `score-${r.id}`,
        examId: r.id,
        overallScore: r.max_total_score > 0
          ? Math.round((r.total_score / r.max_total_score) * 100)
          : 0,
        breakdown: {},
        feedback: "",
        createdAt: r.completed_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error("[ScoreStore] DB read failed, falling back to file:", error);
    }
  }
  return loadFile();
}

export async function addScore(score: ScoreRecord): Promise<void> {
  if (isDatabaseAvailable()) {
    try {
      // Update the exam session with score data
      await execute(
        `UPDATE exam_sessions SET total_score = $1, max_total_score = $2, updated_at = NOW() WHERE id = $3`,
        [score.overallScore, 100, score.examId]
      );
      return;
    } catch (error) {
      console.error("[ScoreStore] DB write failed, falling back to file:", error);
    }
  }
  const scores = loadFile();
  const idx = scores.findIndex((s) => s.id === score.id);
  if (idx >= 0) {
    scores[idx] = score;
  } else {
    scores.push(score);
  }
  saveFile(scores);
}
