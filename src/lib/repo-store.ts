import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { isDatabaseAvailable, query, queryOne, execute } from "./database/client";

const DATA_PATH = join(process.cwd(), ".repo-store.json");

// In-memory fallback for serverless environments (Vercel) where filesystem is read-only
let inMemoryStore: RepoRecord[] = [];

export interface RepoRecord {
  id: string;
  name: string;
  url: string;
  stats: Record<string, unknown>;
  createdAt: string;
}

// --- JSON file fallback ---

function loadFile(): RepoRecord[] {
  try {
    if (existsSync(DATA_PATH)) {
      return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    }
  } catch {}
  return inMemoryStore;
}

function saveFile(repos: RepoRecord[]) {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(repos, null, 2));
  } catch {
    // Filesystem read-only (Vercel) — use in-memory store
    inMemoryStore = repos;
  }
}

// --- PostgreSQL operations ---

async function dbGetRepos(): Promise<RepoRecord[]> {
  const rows = await query<{
    id: string;
    name: string;
    github_url: string;
    language_stats: Record<string, number>;
    total_chunks: number;
    created_at: string;
  }>("SELECT * FROM repositories ORDER BY created_at DESC");

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.github_url,
    stats: {
      ...r.language_stats,
      chunks: r.total_chunks,
    },
    createdAt: r.created_at,
  }));
}

async function dbAddRepo(repo: RepoRecord) {
  const owner = repo.name.split("/")[0] || "unknown";
  await execute(
    `INSERT INTO repositories (id, github_url, name, owner, status, language_stats, total_chunks, ingested_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (id) DO UPDATE SET
       language_stats = EXCLUDED.language_stats,
       total_chunks = EXCLUDED.total_chunks,
       updated_at = NOW()`,
    [
      repo.id,
      repo.url,
      repo.name,
      owner,
      "ready",
      JSON.stringify(repo.stats.languages || {}),
      repo.stats.chunks || repo.stats.totalFiles || 0,
    ]
  );
}

// --- Public API (auto-selects DB or file) ---

export async function getRepos(): Promise<RepoRecord[]> {
  if (isDatabaseAvailable()) {
    try {
      return await dbGetRepos();
    } catch (error) {
      console.error("[RepoStore] DB read failed, falling back to file:", error);
    }
  }
  return loadFile();
}

export async function getRepo(id: string): Promise<RepoRecord | undefined> {
  if (isDatabaseAvailable()) {
    try {
      const row = await queryOne<{
        id: string;
        name: string;
        github_url: string;
        language_stats: Record<string, number>;
        total_chunks: number;
        created_at: string;
      }>("SELECT * FROM repositories WHERE id = $1", [id]);

      if (!row) return undefined;
      return {
        id: row.id,
        name: row.name,
        url: row.github_url,
        stats: { ...row.language_stats, chunks: row.total_chunks },
        createdAt: row.created_at,
      };
    } catch (error) {
      console.error("[RepoStore] DB read failed, falling back to file:", error);
    }
  }
  return loadFile().find((r) => r.id === id);
}

export async function addRepo(repo: RepoRecord): Promise<void> {
  if (isDatabaseAvailable()) {
    try {
      await dbAddRepo(repo);
      return;
    } catch (error) {
      console.error("[RepoStore] DB write failed, falling back to file:", error);
    }
  }
  const repos = loadFile();
  const idx = repos.findIndex((r) => r.id === repo.id);
  if (idx >= 0) {
    repos[idx] = repo;
  } else {
    repos.push(repo);
  }
  saveFile(repos);
}
