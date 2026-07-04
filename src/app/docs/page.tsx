import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    step: "1",
    title: "Connect your repository",
    desc: "Paste any public or private GitHub repository URL. CodeSage clones it, parses the codebase with Tree-sitter, and embeds every code chunk via NV-Embed-QA into a Qdrant vector store.",
  },
  {
    step: "2",
    title: "Choose an examination mode",
    desc: "Pick from Viva Voce (academic defense), Technical Interview (FAANG-style), or Code Review (senior engineer feedback). Each mode calibrates the examiner's focus and scoring rubric.",
  },
  {
    step: "3",
    title: "Answer questions",
    desc: "CodeSage generates questions that reference your actual code — specific file paths, function names, and line numbers. Answer as many as you want, skip freely, end when ready.",
  },
  {
    step: "4",
    title: "Get scored and reviewed",
    desc: "The Nemotron-340B reward model grades each answer on accuracy, depth, and awareness. You get a dimension breakdown, per-question feedback, and an overall score out of 100.",
  },
  {
    step: "5",
    title: "Study and improve",
    desc: "A personalized study guide maps your weak areas to specific concepts and code sections worth reviewing. Track your scores over multiple sessions to see real improvement.",
  },
];

const models = [
  { name: "NV-Embed-QA", role: "Embedding", desc: "Converts code chunks into semantic vectors for retrieval. Optimized for question-answering tasks." },
  { name: "NV-Rerank-QA", role: "Reranking", desc: "Reranks retrieved code chunks by relevance to the question. Ensures the examiner sees the most relevant context." },
  { name: "Llama-3.3-70B-Instruct", role: "Examiner", desc: "Generates viva-ready questions from code context. Probes architecture decisions, trade-offs, and implementation details." },
  { name: "Nemotron-340B-Reward", role: "Scorer", desc: "Evaluates answers against rubrics on accuracy, depth, and code awareness. Produces objective, reproducible scores." },
  { name: "Llama-Guard-3-8B", role: "Safety", desc: "Runs alongside the examiner to ensure all generated questions stay within appropriate academic scope." },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-ink md:text-3xl">Documentation</h1>
      <p className="mt-2 text-muted">
        How CodeSage works, from repository ingestion to scored examination.
      </p>

      {/* How it works */}
      <div className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-ink">How it works</h2>
        {steps.map((s) => (
          <Card key={s.step} variant="dark">
            <CardContent className="flex gap-4 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-ink">
                {s.step}
              </span>
              <div>
                <p className="font-medium text-ink">{s.title}</p>
                <p className="mt-1 text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Models */}
      <div className="mt-12 space-y-4">
        <h2 className="text-lg font-semibold text-ink">AI Models</h2>
        <p className="text-sm text-muted">
          CodeSage uses 5 specialized NVIDIA NIM models, each optimized for its task in the examination pipeline.
        </p>
        {models.map((m) => (
          <Card key={m.name} variant="dark">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm font-semibold text-primary">{m.name}</span>
                <span className="text-xs font-medium text-muted bg-surface-elevated px-2 py-0.5 rounded">{m.role}</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam Modes */}
      <div className="mt-12 space-y-4">
        <h2 className="text-lg font-semibold text-ink">Examination Modes</h2>

        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-base">Viva Voce</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted leading-relaxed">
            Simulates academic viva panels. Questions probe your rationale, alternatives considered, and design intent.
            Ideal for thesis defenses, project evaluations, and course assessments. Difficulty ranges from easy recall
            to expert-level architectural reasoning.
          </CardContent>
        </Card>

        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-base">Technical Interview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted leading-relaxed">
            Replicates FAANG-style system design and code review rounds. Surfaces scalability gaps, edge cases,
            and algorithmic trade-offs in your actual codebase. Designed for interview preparation and self-assessment
            against industry standards.
          </CardContent>
        </Card>

        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-base">Code Review</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted leading-relaxed">
            Generates senior-engineer-level feedback on architecture, coupling, test coverage, and documentation.
            Questions are framed as issues you should be able to explain or justify. Useful for pre-submission
            self-review and improving code quality.
          </CardContent>
        </Card>
      </div>

      {/* Scoring */}
      <div className="mt-12 space-y-4">
        <h2 className="text-lg font-semibold text-ink">Scoring</h2>
        <p className="text-sm text-muted leading-relaxed">
          Each answer is graded by Nemotron-340B on three dimensions:
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <p className="font-medium text-ink">Accuracy (0–100)</p>
            <p className="mt-1 text-sm text-muted">Is the answer factually correct? Does it demonstrate understanding of the code?</p>
          </div>
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <p className="font-medium text-ink">Depth (0–100)</p>
            <p className="mt-1 text-sm text-muted">Does the answer go beyond surface-level explanation? Are trade-offs discussed?</p>
          </div>
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <p className="font-medium text-ink">Code Awareness (0–100)</p>
            <p className="mt-1 text-sm text-muted">Does the answer reference specific files, functions, and line numbers from the codebase?</p>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          The overall score is a weighted average of these three dimensions. Scores above 80 indicate strong understanding.
          Scores below 60 suggest areas that need review.
        </p>
      </div>
    </div>
  );
}
