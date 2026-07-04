import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_PATH = join(process.cwd(), ".repo-store.json");

interface RepoRecord {
  id: string;
  name: string;
  url: string;
  stats: Record<string, unknown>;
  createdAt: string;
}

function load(): RepoRecord[] {
  try {
    if (existsSync(DATA_PATH)) {
      return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

function save(repos: RepoRecord[]) {
  writeFileSync(DATA_PATH, JSON.stringify(repos, null, 2));
}

export function getRepos(): RepoRecord[] {
  return load();
}

export function getRepo(id: string): RepoRecord | undefined {
  return load().find((r) => r.id === id);
}

export function addRepo(repo: RepoRecord) {
  const repos = load();
  const idx = repos.findIndex((r) => r.id === repo.id);
  if (idx >= 0) {
    repos[idx] = repo;
  } else {
    repos.push(repo);
  }
  save(repos);
}
