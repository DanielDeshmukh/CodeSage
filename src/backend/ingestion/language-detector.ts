export interface LanguageInfo {
  language: string;
  extension: string;
  confidence: number;
}

const EXTENSION_MAP: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".c": "c",
  ".h": "c",
  ".cs": "csharp",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".kt": "kotlin",
  ".scala": "scala",
  ".clj": "clojure",
  ".ex": "elixir",
  ".exs": "elixir",
  ".hs": "haskell",
  ".ml": "ocaml",
  ".fs": "fsharp",
  ".vue": "vue",
  ".svelte": "svelte",
  ".sql": "sql",
  ".sh": "shell",
  ".bash": "shell",
  ".zsh": "shell",
  ".ps1": "powershell",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".json": "json",
  ".xml": "xml",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".less": "less",
  ".md": "markdown",
  ".txt": "text",
  ".dockerfile": "dockerfile",
  ".tf": "terraform",
  ".proto": "protobuf",
  ".graphql": "graphql",
  ".gql": "graphql",
};

const FILENAME_MAP: Record<string, string> = {
  "Dockerfile": "dockerfile",
  "docker-compose.yml": "yaml",
  "docker-compose.yaml": "yaml",
  ".gitignore": "text",
  ".env": "text",
  ".env.local": "text",
  "Makefile": "makefile",
  "CMakeLists.txt": "cmake",
  "package.json": "json",
  "tsconfig.json": "json",
  "Cargo.toml": "toml",
  "go.mod": "gomod",
  "requirements.txt": "text",
  "setup.py": "python",
  "pyproject.toml": "toml",
  "pom.xml": "xml",
  "build.gradle": "gradle",
  "Gemfile": "ruby",
  "Podfile": "ruby",
};

export class LanguageDetector {
  detect(filename: string): LanguageInfo {
    // Check filename mapping first
    const baseName = filename.split("/").pop() || filename;
    if (FILENAME_MAP[baseName]) {
      return {
        language: FILENAME_MAP[baseName],
        extension: "",
        confidence: 1.0,
      };
    }

    // Check extension
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) {
      return { language: "unknown", extension: "", confidence: 0 };
    }

    const extension = filename.slice(lastDot).toLowerCase();
    const language = EXTENSION_MAP[extension];

    if (language) {
      return {
        language,
        extension,
        confidence: 0.9,
      };
    }

    return {
      language: "unknown",
      extension,
      confidence: 0,
    };
  }

  detectBulk(
    files: Array<{ path: string }>
  ): Map<string, { count: number; totalSize: number }> {
    const stats = new Map<string, { count: number; totalSize: number }>();

    for (const file of files) {
      const detected = this.detect(file.path);
      const current = stats.get(detected.language) || {
        count: 0,
        totalSize: 0,
      };
      stats.set(detected.language, {
        count: current.count + 1,
        totalSize: current.totalSize,
      });
    }

    return stats;
  }

  getSupportedLanguages(): string[] {
    const languages = new Set(Object.values(EXTENSION_MAP));
    return Array.from(languages).sort();
  }

  isSupported(filename: string): boolean {
    const detected = this.detect(filename);
    return detected.language !== "unknown";
  }
}

let instance: LanguageDetector | null = null;

export function getLanguageDetector(): LanguageDetector {
  if (!instance) {
    instance = new LanguageDetector();
  }
  return instance;
}
