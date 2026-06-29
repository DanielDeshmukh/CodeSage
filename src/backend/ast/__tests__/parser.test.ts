import { describe, it, expect } from "vitest";
import { parseFile, isLanguageSupported, getLanguageFromFilePath } from "../parser";

describe("AST Parser", () => {
  describe("parseFile", () => {
    describe("TypeScript/JavaScript", () => {
      it("should parse function declarations", () => {
        const code = `
          function hello(name: string): string {
            return "Hello, " + name;
          }
        `;
        const chunks = parseFile(code, "test.ts", "typescript");

        expect(chunks).toHaveLength(1);
        expect(chunks[0].type).toBe("function");
        expect(chunks[0].name).toBe("hello");
        expect(chunks[0].language).toBe("typescript");
      });

      it("should parse class declarations", () => {
        const code = `
          class Calculator {
            add(a: number, b: number): number {
              return a + b;
            }
          }
        `;
        const chunks = parseFile(code, "test.ts", "typescript");

        expect(chunks).toHaveLength(1);
        expect(chunks[0].type).toBe("class");
        expect(chunks[0].name).toBe("Calculator");
      });

      it("should detect TODO comments", () => {
        const code = `
          function todo(): void {
            // TODO: implement this
          }
        `;
        const chunks = parseFile(code, "test.ts", "typescript");

        expect(chunks[0].hasTodos).toBe(true);
      });

      it("should count function calls", () => {
        const code = `
          function process(): void {
            console.log("test");
            fetch("api");
          }
        `;
        const chunks = parseFile(code, "test.ts", "typescript");

        expect(chunks[0].calls).toContain("console");
        expect(chunks[0].calls).toContain("fetch");
      });

      it("should calculate complexity", () => {
        const code = `
          function complex(x: number): number {
            if (x > 0) {
              for (let i = 0; i < x; i++) {
                if (i % 2 === 0) {
                  return i;
                }
              }
            }
            return -1;
          }
        `;
        const chunks = parseFile(code, "test.ts", "typescript");

        expect(chunks[0].complexity).toBeGreaterThan(1);
      });
    });

    describe("Python", () => {
      it("should parse function definitions", () => {
        const code = `
def greet(name):
    return f"Hello, {name}"
        `;
        const chunks = parseFile(code, "test.py", "python");

        expect(chunks).toHaveLength(1);
        expect(chunks[0].type).toBe("function");
        expect(chunks[0].name).toBe("greet");
        expect(chunks[0].language).toBe("python");
      });

      it("should parse class definitions", () => {
        const code = `
class Dog:
    def __init__(self, name):
        self.name = name
        `;
        const chunks = parseFile(code, "test.py", "python");

        expect(chunks).toHaveLength(1);
        expect(chunks[0].type).toBe("class");
        expect(chunks[0].name).toBe("Dog");
      });
    });

    describe("Java", () => {
      it("should parse method declarations", () => {
        const code = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
        `;
        const chunks = parseFile(code, "Main.java", "java");

        expect(chunks.length).toBeGreaterThanOrEqual(1);
        expect(chunks.some((c) => c.type === "class")).toBe(true);
      });
    });

    describe("Unsupported languages", () => {
      it("should return whole file as module chunk", () => {
        const code = "SELECT * FROM users;";
        const chunks = parseFile(code, "query.sql", "sql");

        expect(chunks).toHaveLength(1);
        expect(chunks[0].type).toBe("module");
        expect(chunks[0].name).toBe("query.sql");
      });
    });
  });

  describe("isLanguageSupported", () => {
    it("should return true for supported languages", () => {
      expect(isLanguageSupported("typescript")).toBe(true);
      expect(isLanguageSupported("javascript")).toBe(true);
      expect(isLanguageSupported("python")).toBe(true);
      expect(isLanguageSupported("java")).toBe(true);
    });

    it("should return false for unsupported languages", () => {
      expect(isLanguageSupported("sql")).toBe(false);
      expect(isLanguageSupported("markdown")).toBe(false);
    });
  });

  describe("getLanguageFromFilePath", () => {
    it("should detect language from extension", () => {
      expect(getLanguageFromFilePath("app.ts")).toBe("typescript");
      expect(getLanguageFromFilePath("index.js")).toBe("javascript");
      expect(getLanguageFromFilePath("main.py")).toBe("python");
      expect(getLanguageFromFilePath("Main.java")).toBe("java");
    });

    it("should return null for unknown extensions", () => {
      expect(getLanguageFromFilePath("README")).toBeNull();
      expect(getLanguageFromFilePath("data.xyz")).toBeNull();
    });
  });
});
