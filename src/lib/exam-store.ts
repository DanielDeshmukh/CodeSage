import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { isDatabaseAvailable, query, queryOne, execute } from "./database/client";

const DATA_PATH = join(process.cwd(), ".exam-store.json");

// In-memory fallback for serverless environments (Vercel)
let inMemoryStore: ExamRecord[] = [];

export interface ExamRecord {
  id: string;
  repositoryId: string;
  mode: string;
  difficulty: string;
  status: string;
  totalScore: number;
  maxTotalScore: number;
  questions: unknown[];
  answers: unknown[];
  evaluations: unknown[];
  startedAt: string;
  completedAt: string | null;
}

// --- JSON file fallback ---

function loadFile(): ExamRecord[] {
  try {
    if (existsSync(DATA_PATH)) {
      return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    }
  } catch {}
  return inMemoryStore;
}

function saveFile(exams: ExamRecord[]) {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(exams, null, 2));
  } catch {
    // Filesystem read-only (Vercel) — use in-memory store
    inMemoryStore = exams;
  }
}

// --- PostgreSQL operations ---

async function dbGetExams(): Promise<ExamRecord[]> {
  const rows = await query<{
    id: string;
    repository_id: string;
    mode: string;
    difficulty: string;
    status: string;
    total_score: number;
    max_total_score: number;
    questions: unknown[];
    answers: unknown[];
    evaluations: unknown[];
    started_at: string;
    completed_at: string | null;
  }>("SELECT * FROM exam_sessions ORDER BY created_at DESC");

  return rows.map((r) => ({
    id: r.id,
    repositoryId: r.repository_id,
    mode: r.mode,
    difficulty: r.difficulty,
    status: r.status,
    totalScore: r.total_score,
    maxTotalScore: r.max_total_score,
    questions: r.questions || [],
    answers: r.answers || [],
    evaluations: r.evaluations || [],
    startedAt: r.started_at,
    completedAt: r.completed_at,
  }));
}

async function dbAddExam(exam: ExamRecord) {
  await execute(
    `INSERT INTO exam_sessions (id, repository_id, mode, difficulty, status, questions, answers, evaluations, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       questions = EXCLUDED.questions,
       answers = EXCLUDED.answers,
       evaluations = EXCLUDED.evaluations,
       updated_at = NOW()`,
    [
      exam.id,
      exam.repositoryId,
      exam.mode,
      exam.difficulty,
      exam.status,
      JSON.stringify(exam.questions),
      JSON.stringify(exam.answers),
      JSON.stringify(exam.evaluations),
      exam.startedAt,
    ]
  );
}

async function dbUpdateExam(id: string, data: Partial<ExamRecord>) {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    status: "status",
    totalScore: "total_score",
    maxTotalScore: "max_total_score",
    questions: "questions",
    answers: "answers",
    evaluations: "evaluations",
    completedAt: "completed_at",
  };

  for (const [key, value] of Object.entries(data)) {
    const dbCol = fieldMap[key];
    if (dbCol && value !== undefined) {
      sets.push(`${dbCol} = $${idx}`);
      values.push(typeof value === "object" ? JSON.stringify(value) : value);
      idx++;
    }
  }

  if (sets.length === 0) return;
  sets.push("updated_at = NOW()");
  values.push(id);

  await execute(
    `UPDATE exam_sessions SET ${sets.join(", ")} WHERE id = $${idx}`,
    values
  );
}

// --- Public API ---

export async function getExams(): Promise<ExamRecord[]> {
  if (isDatabaseAvailable()) {
    try {
      return await dbGetExams();
    } catch (error) {
      console.error("[ExamStore] DB read failed, falling back to file:", error);
    }
  }
  return loadFile();
}

export async function getExam(id: string): Promise<ExamRecord | undefined> {
  if (isDatabaseAvailable()) {
    try {
      const row = await queryOne<{
        id: string;
        repository_id: string;
        mode: string;
        difficulty: string;
        status: string;
        total_score: number;
        max_total_score: number;
        questions: unknown[];
        answers: unknown[];
        evaluations: unknown[];
        started_at: string;
        completed_at: string | null;
      }>("SELECT * FROM exam_sessions WHERE id = $1", [id]);

      if (!row) return undefined;
      return {
        id: row.id,
        repositoryId: row.repository_id,
        mode: row.mode,
        difficulty: row.difficulty,
        status: row.status,
        totalScore: row.total_score,
        maxTotalScore: row.max_total_score,
        questions: row.questions || [],
        answers: row.answers || [],
        evaluations: row.evaluations || [],
        startedAt: row.started_at,
        completedAt: row.completed_at,
      };
    } catch (error) {
      console.error("[ExamStore] DB read failed, falling back to file:", error);
    }
  }
  return loadFile().find((e) => e.id === id);
}

export async function addExam(exam: ExamRecord): Promise<void> {
  if (isDatabaseAvailable()) {
    try {
      await dbAddExam(exam);
      return;
    } catch (error) {
      console.error("[ExamStore] DB write failed, falling back to file:", error);
    }
  }
  const exams = loadFile();
  const idx = exams.findIndex((e) => e.id === exam.id);
  if (idx >= 0) {
    exams[idx] = exam;
  } else {
    exams.push(exam);
  }
  saveFile(exams);
}

export async function updateExam(id: string, data: Partial<ExamRecord>): Promise<void> {
  if (isDatabaseAvailable()) {
    try {
      await dbUpdateExam(id, data);
      return;
    } catch (error) {
      console.error("[ExamStore] DB update failed, falling back to file:", error);
    }
  }
  const exams = loadFile();
  const idx = exams.findIndex((e) => e.id === id);
  if (idx >= 0) {
    exams[idx] = { ...exams[idx], ...data };
    saveFile(exams);
  }
}
