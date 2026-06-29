// ============================================================================
// Tree-sitter AST Parser
// ============================================================================

export interface ASTNode {
  type: string;
  name: string | null;
  text: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  children: ASTNode[];
}

export interface ParsedChunk {
  type: "function" | "class" | "module" | "config" | "documentation";
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  language: string;
  calls: string[];
  complexity: number;
  hasTodos: boolean;
  dependencyCount: number;
}

// Supported languages for AST parsing
const SUPPORTED_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "rust",
  "cpp",
  "c",
  "csharp",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "scala",
  "vue",
  "svelte",
];

// ============================================================================
// Language-specific parsers (simplified implementations)
// ============================================================================

function parseTypeScript(content: string, _filePath: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const lines = content.split("\n");

  let currentChunk: Partial<ParsedChunk> | null = null;
  let braceCount = 0;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect function declarations
    const funcMatch = trimmed.match(
      /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/
    );
    if (funcMatch && !currentChunk) {
      currentChunk = {
        type: "function",
        name: funcMatch[1],
        startLine: i + 1,
        calls: [],
        complexity: 1,
        hasTodos: false,
        dependencyCount: 0,
      };
      startLine = i;
      braceCount = 0;
    }

    // Detect class declarations
    const classMatch = trimmed.match(
      /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/
    );
    if (classMatch && !currentChunk) {
      currentChunk = {
        type: "class",
        name: classMatch[1],
        startLine: i + 1,
        calls: [],
        complexity: 1,
        hasTodos: false,
        dependencyCount: 0,
      };
      startLine = i;
      braceCount = 0;
    }

    if (currentChunk) {
      // Count braces for block detection
      for (const char of line) {
        if (char === "{") braceCount++;
        if (char === "}") braceCount--;
      }

      // Check for TODOs
      if (trimmed.includes("TODO") || trimmed.includes("FIXME")) {
        currentChunk.hasTodos = true;
      }

      // Detect function calls
      const callMatches = trimmed.matchAll(/(\w+)\s*\(/g);
      for (const match of callMatches) {
        if (
          match[1] !== "if" &&
          match[1] !== "for" &&
          match[1] !== "while" &&
          match[1] !== "switch"
        ) {
          currentChunk.calls?.push(match[1]);
        }
      }

      // Calculate complexity (simplified)
      if (
        trimmed.startsWith("if") ||
        trimmed.startsWith("else") ||
        trimmed.startsWith("for") ||
        trimmed.startsWith("while") ||
        trimmed.startsWith("switch") ||
        trimmed.startsWith("case") ||
        trimmed.startsWith("catch")
      ) {
        currentChunk.complexity = (currentChunk.complexity || 1) + 1;
      }

      // End of block
      if (braceCount === 0 && currentChunk.name) {
        chunks.push({
          type: currentChunk.type as ParsedChunk["type"],
          name: currentChunk.name,
          content: lines.slice(startLine, i + 1).join("\n"),
          startLine: currentChunk.startLine || 1,
          endLine: i + 1,
          language: "typescript",
          calls: currentChunk.calls || [],
          complexity: currentChunk.complexity || 1,
          hasTodos: currentChunk.hasTodos || false,
          dependencyCount: currentChunk.dependencyCount || 0,
        });
        currentChunk = null;
      }
    }
  }

  return chunks;
}

function parsePython(content: string, _filePath: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const lines = content.split("\n");

  let currentChunk: Partial<ParsedChunk> | null = null;
  let indentLevel = 0;
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const currentIndent = line.length - line.trimStart().length;

    // Detect function definitions
    const funcMatch = trimmed.match(/^(?:async\s+)?def\s+(\w+)/);
    if (funcMatch && !currentChunk) {
      currentChunk = {
        type: "function",
        name: funcMatch[1],
        startLine: i + 1,
        calls: [],
        complexity: 1,
        hasTodos: false,
        dependencyCount: 0,
      };
      startLine = i;
      indentLevel = currentIndent;
    }

    // Detect class definitions
    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch && !currentChunk) {
      currentChunk = {
        type: "class",
        name: classMatch[1],
        startLine: i + 1,
        calls: [],
        complexity: 1,
        hasTodos: false,
        dependencyCount: 0,
      };
      startLine = i;
      indentLevel = currentIndent;
    }

    if (currentChunk) {
      // Check for TODOs
      if (trimmed.includes("TODO") || trimmed.includes("FIXME")) {
        currentChunk.hasTodos = true;
      }

      // Detect function calls
      const callMatches = trimmed.matchAll(/(\w+)\s*\(/g);
      for (const match of callMatches) {
        if (
          match[1] !== "if" &&
          match[1] !== "for" &&
          match[1] !== "while" &&
          match[1] !== "with" &&
          match[1] !== "elif"
        ) {
          currentChunk.calls?.push(match[1]);
        }
      }

      // Calculate complexity (simplified)
      if (
        trimmed.startsWith("if") ||
        trimmed.startsWith("elif") ||
        trimmed.startsWith("for") ||
        trimmed.startsWith("while") ||
        trimmed.startsWith("except") ||
        trimmed.startsWith("with")
      ) {
        currentChunk.complexity = (currentChunk.complexity || 1) + 1;
      }

      // End of block (dedent or empty line)
      if (currentIndent <= indentLevel && trimmed !== "" && i > startLine) {
        chunks.push({
          type: currentChunk.type as ParsedChunk["type"],
          name: currentChunk.name || "",
          content: lines.slice(startLine, i).join("\n"),
          startLine: currentChunk.startLine || 1,
          endLine: i,
          language: "python",
          calls: currentChunk.calls || [],
          complexity: currentChunk.complexity || 1,
          hasTodos: currentChunk.hasTodos || false,
          dependencyCount: currentChunk.dependencyCount || 0,
        });
        currentChunk = null;
      }
    }
  }

  // Handle last chunk
  if (currentChunk?.name) {
    chunks.push({
      type: currentChunk.type as ParsedChunk["type"],
      name: currentChunk.name,
      content: lines.slice(startLine).join("\n"),
      startLine: currentChunk.startLine || 1,
      endLine: lines.length,
      language: "python",
      calls: currentChunk.calls || [],
      complexity: currentChunk.complexity || 1,
      hasTodos: currentChunk.hasTodos || false,
      dependencyCount: currentChunk.dependencyCount || 0,
    });
  }

  return chunks;
}

// ============================================================================
// Main Parser
// ============================================================================

export function parseFile(
  content: string,
  filePath: string,
  language: string
): ParsedChunk[] {
  // Normalize language
  const lang = language.toLowerCase();

  switch (lang) {
    case "typescript":
    case "tsx":
    case "javascript":
    case "jsx":
      return parseTypeScript(content, filePath);
    case "python":
      return parsePython(content, filePath);
    default:
      // For unsupported languages, return the whole file as a single chunk
      return [
        {
          type: "module",
          name: filePath.split("/").pop() || filePath,
          content,
          startLine: 1,
          endLine: content.split("\n").length,
          language: lang,
          calls: [],
          complexity: 1,
          hasTodos: content.includes("TODO") || content.includes("FIXME"),
          dependencyCount: 0,
        },
      ];
  }
}

export function isLanguageSupported(language: string): boolean {
  return SUPPORTED_LANGUAGES.includes(language.toLowerCase());
}

export function getLanguageFromFilePath(filePath: string): string | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
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
  return ext ? langMap[ext] || null : null;
}
