import type { ParsedChunk } from "./parser";
import path from "path";

let Parser: typeof import("web-tree-sitter")["Parser"] | null = null;
let Language: typeof import("web-tree-sitter")["Language"] | null = null;
let initialized = false;

const LANGUAGE_MAP: Record<string, string> = {
  typescript: "tree-sitter-typescript",
  tsx: "tree-sitter-tsx",
  typescriptreact: "tree-sitter-tsx",
  javascript: "tree-sitter-javascript",
  javascriptreact: "tree-sitter-javascript",
  jsx: "tree-sitter-javascript",
  python: "tree-sitter-python",
  java: "tree-sitter-java",
};

async function initParser() {
  if (initialized) return;

  try {
    const webTreeSitter = await import("web-tree-sitter");
    Parser = webTreeSitter.Parser;
    Language = webTreeSitter.Language;

    await Parser.init();

    initialized = true;
  } catch (err) {
    console.warn("Failed to initialize tree-sitter, falling back to regex parser:", err);
  }
}

async function loadLanguage(langName: string): Promise<any> {
  if (!Language) return null;

  const wasmFile = `${langName}.wasm`;
  try {
    // Try multiple paths for WASM file resolution
    const possiblePaths = [
      `/${wasmFile}`,                                    // Next.js public directory (runtime)
      path.join(process.cwd(), "public", wasmFile),      // Absolute path to public/
    ];

    for (const p of possiblePaths) {
      try {
        return await Language.load(p);
      } catch {
        continue;
      }
    }
    return null;
  } catch (err) {
    console.warn(`Failed to load language ${langName}:`, err);
    return null;
  }
}

function extractCalls(node: any, lines: string[]): string[] {
  const calls: string[] = [];

  function walk(n: any) {
    if (n.type === "call_expression") {
      const fn = n.childForFieldName("function");
      if (fn) {
        let name = "";
        if (fn.type === "identifier") {
          name = fn.text;
        } else if (fn.type === "member_expression") {
          const obj = fn.childForFieldName("object");
          const prop = fn.childForFieldName("property");
          if (obj && prop) {
            name = `${obj.text}.${prop.text}`;
          }
        }
        if (name && !["if", "for", "while", "switch", "catch", "return"].includes(name)) {
          calls.push(name);
        }
      }
    }
    for (let i = 0; i < n.childCount; i++) {
      walk(n.child(i));
    }
  }

  walk(node);
  return [...new Set(calls)];
}

function countComplexity(node: any): number {
  let complexity = 1;

  const branchingTypes = [
    "if_statement",
    "else_clause",
    "for_statement",
    "while_statement",
    "switch_statement",
    "case_clause",
    "catch_clause",
    "conditional_expression",
    "logical_binary_expression",
    "binary_expression",
  ];

  function walk(n: any) {
    if (branchingTypes.includes(n.type)) {
      complexity++;
    }
    for (let i = 0; i < n.childCount; i++) {
      walk(n.child(i));
    }
  }

  walk(node);
  return complexity;
}

function extractChunks(node: any, source: string, language: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const lines = source.split("\n");

  function getChunkContent(n: any): string {
    const startLine = n.startPosition.row;
    const endLine = n.endPosition.row;
    return lines.slice(startLine, endLine + 1).join("\n");
  }

  function walk(n: any) {
    let chunkType: ParsedChunk["type"] | null = null;
    let name = "";

    switch (n.type) {
      case "function_declaration":
      case "function":
      case "arrow_function":
      case "function_definition":
        chunkType = "function";
        const nameNode = n.childForFieldName("name");
        name = nameNode?.text || "anonymous";
        break;

      case "class_declaration":
      case "class":
      case "class_definition":
        chunkType = "class";
        const className = n.childForFieldName("name");
        name = className?.text || "anonymous";
        break;

      case "method_definition":
      case "method_declaration":
        chunkType = "function";
        const methodName = n.childForFieldName("name");
        name = methodName?.text || "anonymous";
        break;

      case "interface_declaration":
        chunkType = "class";
        const interfaceName = n.childForFieldName("name");
        name = interfaceName?.text || "anonymous";
        break;

      case "enum_declaration":
        chunkType = "class";
        const enumName = n.childForFieldName("name");
        name = enumName?.text || "anonymous";
        break;

      case "export_statement":
        if (n.childCount > 0) {
          const child = n.child(0);
          if (child && (child.type.includes("function") || child.type.includes("class"))) {
            walk(child);
            return;
          }
        }
        break;

      case "module":
      case "program":
        for (let i = 0; i < n.childCount; i++) {
          walk(n.child(i));
        }
        return;
    }

    if (chunkType && name) {
      const content = getChunkContent(n);
      const calls = extractCalls(n, lines);
      const complexity = countComplexity(n);
      const hasTodos = content.includes("TODO") || content.includes("FIXME");

      chunks.push({
        type: chunkType,
        name,
        content,
        startLine: n.startPosition.row + 1,
        endLine: n.endPosition.row + 1,
        language,
        calls,
        complexity,
        hasTodos,
        dependencyCount: calls.length,
      });
    }

    for (let i = 0; i < n.childCount; i++) {
      walk(n.child(i));
    }
  }

  walk(node);
  return chunks;
}

export async function parseWithTreeSitter(
  source: string,
  language: string
): Promise<ParsedChunk[] | null> {
  await initParser();

  if (!Parser || !initialized) return null;

  const langName = LANGUAGE_MAP[language.toLowerCase()];
  if (!langName) return null;

  const lang = await loadLanguage(langName);
  if (!lang) return null;

  try {
    const parser = new Parser();
    parser.setLanguage(lang);
    const tree = parser.parse(source);
    const chunks = extractChunks(tree.rootNode, source, language);

    if (chunks.length === 0) {
      return [
        {
          type: "module",
          name: "module",
          content: source,
          startLine: 1,
          endLine: source.split("\n").length,
          language,
          calls: [],
          complexity: 1,
          hasTodos: source.includes("TODO") || source.includes("FIXME"),
          dependencyCount: 0,
        },
      ];
    }

    return chunks;
  } catch (err) {
    console.warn(`Tree-sitter parsing failed for ${language}:`, err);
    return null;
  }
}

export function isTreeSitterSupported(language: string): boolean {
  return language.toLowerCase() in LANGUAGE_MAP;
}
