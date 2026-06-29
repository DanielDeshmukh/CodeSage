import { env } from "@/lib/env";

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  cloneUrl: string;
  private: boolean;
}

export class GitHubService {
  private token?: string;

  constructor() {
    this.token = env.GITHUB_TOKEN || undefined;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }
    return headers;
  }

  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/,
      /^([^/]+)\/([^/]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }
    return null;
  }

  async validateRepoUrl(url: string): Promise<boolean> {
    const parsed = this.parseRepoUrl(url);
    if (!parsed) return false;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
        { headers: this.getHeaders() }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRepoInfo(url: string): Promise<GitHubRepoInfo | null> {
    const parsed = this.parseRepoUrl(url);
    if (!parsed) return null;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return {
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description || "",
        defaultBranch: data.default_branch,
        language: data.language || "Unknown",
        stars: data.stargazers_count,
        forks: data.forks_count,
        url: data.html_url,
        cloneUrl: data.clone_url,
        private: data.private,
      };
    } catch {
      return null;
    }
  }

  async getRepoLanguages(
    owner: string,
    repo: string
  ): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/languages`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return {};
      return response.json();
    } catch {
      return {};
    }
  }
}

let instance: GitHubService | null = null;

export function getGitHubService(): GitHubService {
  if (!instance) {
    instance = new GitHubService();
  }
  return instance;
}
