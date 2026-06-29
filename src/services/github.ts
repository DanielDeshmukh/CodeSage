import { env } from "@/lib/env";

// ============================================================================
// GitHub API Client
// ============================================================================

export interface GitHubRepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  stars: number;
  forks: number;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubFile {
  path: string;
  name: string;
  content: string;
  size: number;
  language: string | null;
}

export class GitHubClient {
  private token?: string;
  private baseUrl = "https://api.github.com";

  constructor() {
    this.token = env.GITHUB_TOKEN;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  // --------------------------------------------------------------------------
  // Parse GitHub URL
  // --------------------------------------------------------------------------

  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    // Support formats:
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    // owner/repo

    const httpsMatch = url.match(
      /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/
    );
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }

    const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    const shortMatch = url.match(/^([^/]+)\/([^/]+)$/);
    if (shortMatch) {
      return { owner: shortMatch[1], repo: shortMatch[2] };
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // Get Repository Info
  // --------------------------------------------------------------------------

  async getRepoInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repo info: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      defaultBranch: data.default_branch,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // --------------------------------------------------------------------------
  // Get Repository Tree
  // --------------------------------------------------------------------------

  async getRepoTree(
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<{ path: string; type: string; size?: number }[]> {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repo tree: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tree
      .filter((item: { type: string }) => item.type === "blob")
      .map((item: { path: string; type: string; size?: number }) => ({
        path: item.path,
        type: item.type,
        size: item.size,
      }));
  }

  // --------------------------------------------------------------------------
  // Get File Content
  // --------------------------------------------------------------------------

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string = "main"
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }

    const data = await response.json();
    // Content is base64 encoded
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  // --------------------------------------------------------------------------
  // Clone Repository (via tarball)
  // --------------------------------------------------------------------------

  async cloneRepository(
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<GitHubFile[]> {
    const tree = await this.getRepoTree(owner, repo, branch);

    // Filter for source files
    const sourceExtensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".cpp",
      ".c",
      ".h",
      ".hpp",
      ".cs",
      ".rb",
      ".php",
      ".swift",
      ".kt",
      ".scala",
      ".vue",
      ".svelte",
    ];

    const sourceFiles = tree.filter((file) => {
      const ext = file.path.split(".").pop()?.toLowerCase();
      return ext && sourceExtensions.includes(`.${ext}`);
    });

    // Fetch content for each file (limit to 100 files for now)
    const files: GitHubFile[] = [];
    const filesToFetch = sourceFiles.slice(0, 100);

    for (const file of filesToFetch) {
      try {
        const content = await this.getFileContent(owner, repo, file.path, branch);
        const ext = file.path.split(".").pop()?.toLowerCase();
        files.push({
          path: file.path,
          name: file.path.split("/").pop() || file.path,
          content,
          size: file.size || 0,
          language: this.getLanguageFromExt(ext || ""),
        });
      } catch (error) {
        console.error(`Failed to fetch ${file.path}:`, error);
      }
    }

    return files;
  }

  // --------------------------------------------------------------------------
  // Helper: Get Language from Extension
  // --------------------------------------------------------------------------

  private getLanguageFromExt(ext: string): string | null {
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      java: "java",
      go: "go",
      rs: "rust",
      cpp: "cpp",
      c: "c",
      h: "c",
      hpp: "cpp",
      cs: "csharp",
      rb: "ruby",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      scala: "scala",
      vue: "vue",
      svelte: "svelte",
    };
    return langMap[ext] || null;
  }
}

// Singleton instance
let githubInstance: GitHubClient | null = null;

export function getGitHubClient(): GitHubClient {
  if (!githubInstance) {
    githubInstance = new GitHubClient();
  }
  return githubInstance;
}
