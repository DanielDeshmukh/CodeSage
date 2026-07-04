import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-ink md:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">
        Last updated: July 2026
      </p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Data Collection</h2>
          <p className="text-sm text-muted leading-relaxed">
            CodeSage collects only the data necessary to provide its examination services:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted leading-relaxed list-disc list-inside">
            <li><strong className="text-ink">GitHub account data</strong> — Your username, email, and profile image via GitHub OAuth. Used solely for authentication.</li>
            <li><strong className="text-ink">Repository URLs</strong> — The URLs of repositories you submit for analysis. We clone, parse, and embed your code for examination purposes only.</li>
            <li><strong className="text-ink">Exam sessions</strong> — Your answers, scores, and generated questions. Stored locally and in our vector database to provide scoring and study guides.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">How Your Code is Used</h2>
          <p className="text-sm text-muted leading-relaxed">
            Your codebase is cloned, parsed into an abstract syntax tree (AST), and embedded into a vector database for semantic search. The AI models use this context to generate examination questions and evaluate your answers. Your code is <strong className="text-ink">never</strong> used to train any models, shared with third parties, or made publicly accessible.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Data Storage</h2>
          <p className="text-sm text-muted leading-relaxed">
            All data is stored in encrypted databases and vector stores. Repository clones are temporary and deleted after embedding. Exam sessions and scores are retained indefinitely unless you choose to delete them. API keys are stored encrypted and never transmitted in plain text.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Third-Party Services</h2>
          <ul className="space-y-2 text-sm text-muted leading-relaxed list-disc list-inside">
            <li><strong className="text-ink">GitHub</strong> — OAuth authentication and repository cloning via the GitHub API.</li>
            <li><strong className="text-ink">NVIDIA NIM</strong> — AI model inference for embedding, reranking, question generation, scoring, and safety. Prompts are not retained beyond the request lifecycle.</li>
            <li><strong className="text-ink">Qdrant</strong> — Vector database for code embedding storage and retrieval.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Cookies and Sessions</h2>
          <p className="text-sm text-muted leading-relaxed">
            CodeSage uses session cookies for authentication only. No tracking cookies, analytics, or advertising cookies are used. Session data is stored securely and expires on sign-out.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Data Deletion</h2>
          <p className="text-sm text-muted leading-relaxed">
            You can delete your data at any time from the Settings page. This removes all repositories, exam sessions, scores, and associated vector embeddings. Account deletion removes your GitHub OAuth connection. Data deletion is permanent and irreversible.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Open Source</h2>
          <p className="text-sm text-muted leading-relaxed">
            CodeSage is open source. You can review the full codebase at{" "}
            <a href="https://github.com/DanielDeshmukh/CodeSage" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              github.com/DanielDeshmukh/CodeSage
            </a>{" "}
            to verify our privacy practices.
          </p>
        </section>
      </div>
    </div>
  );
}
