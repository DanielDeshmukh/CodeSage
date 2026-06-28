# CodeSage — End-to-End Development Plan
### Next.js 15 + TypeScript + Tailwind CSS 4 + NVIDIA NIM AI Stack

---

## Core Principle: Five Jobs, Five Models

CodeSage has five distinct jobs. We do NOT use one model for all five. Each gets the right model deployed as a microservice behind a unified API.

| Job | Model | Role |
|-----|-------|------|
| **Embedding** | `nvidia/llama-nemotron-embed-1b-v2` | NeMo Retriever Embedding NIM — embeds code chunks into 768-dim vectors |
| **Reranking** | `nvidia/llama-nemotron-rerank-1b-v2` | NeMo Retriever Reranking NIM — rescores chunks by examinability |
| **Examiner Brain** | `Llama-Nemotron-Super` (49B) | Question generation + feedback — 1M context window, genuine code reasoning |
| **Answer Scoring** | `Nemotron-4-340B-Reward` | Trained to judge quality — numerical scoring on accuracy, depth, awareness |
| **Safety** | `Nemotron 3.5 Content Safety` | Free NIM — pre-filters all inputs for prompt injection, malicious content |

### The Full Stack Flow

```
INGESTION
  code chunks → llama-nemotron-embed-1b-v2 → Qdrant

RETRIEVAL
  vector search → top-10 → llama-nemotron-rerank-1b-v2 → top-3

EXAMINATION
  top-3 chunks → Llama-Nemotron-Super → exam question

EVALUATION
  developer answer → Nemotron-4-340B-Reward → score
                   → Llama-Nemotron-Super → feedback + follow-up

SAFETY (runs everywhere)
  all inputs → Nemotron 3.5 Content Safety → pass / flag
```

### Why NIM (not just Hugging Face)?

- NIM microservices = production-grade runtimes with ongoing security updates
- Optimized throughput/latency out of the box for concurrent users
- Start with `build.nvidia.com` free API endpoints to prototype
- Pull NIM Docker containers to self-host for production — same API, zero code changes

---

## Design System: Binance-Inspired Dark Theme

Using `npx getdesign@latest add binance` to get a professional dark design system:
- Dark background (`#0B0E11`) with card surfaces (`#1E2329`)
- Accent colors: `#F0B90B` (gold/primary), `#0ECB81` (green/success), `#F6465D` (red/danger)
- Monospace code blocks, sharp corners, minimal shadows
- Data-dense dashboard aesthetic

---

## Agent Skills (6 Installed)

| Skill | Source | Purpose |
|-------|--------|---------|
| `frontend-design` | anthropics/skills | Best practices for frontend component architecture, responsive design, accessibility |
| `design-taste-frontend` | leonxlnx/taste-skill | Design taste, visual hierarchy, spacing, color theory for frontend |
| `web-design-guidelines` | vercel-labs/agent-skills | Vercel's web design guidelines, performance patterns, Next.js conventions |
| `ui-ux-pro-max` | nextlevelbuilder/ui-ux-pro-max-skill | Advanced UI/UX patterns, micro-interactions, animation, dark mode |
| `data-designer` | NVIDIA/skills | Dataset creation, synthetic data generation for training/evaluation |
| `nemo-evaluator-plugin` | NVIDIA/skills | NeMo evaluation metrics, RAG quality measurement, faithfulness scoring |

### How Skills Are Used

| Phase | Active Skills |
|-------|---------------|
| Phase 1-3 (Frontend) | frontend-design, design-taste-frontend, web-design-guidelines, ui-ux-pro-max |
| Phase 4-7 (Backend/AI) | data-designer, nemo-evaluator-plugin |
| Phase 8 (Reports) | ui-ux-pro-max, nemo-evaluator-plugin |
| Phase 9 (Testing) | nemo-evaluator-plugin (RAG quality metrics) |

### Configuration

Skills are loaded from `.agents/skills/` via `opencode.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": [".agents/skills"]
  }
}
```

---

## Architecture: Microservices Behind Unified API

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js Frontend                       │
│              (App Router + Tailwind + Zustand)            │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                  Next.js API Layer                        │
│           (Route Handlers + Server Actions)               │
└──────────────────────────┬───────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │ Ingestion  │   │ Examination│   │   Score   │
    │  Service   │   │  Engine    │   │  Service  │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │                │                │
    ┌─────▼────────────────▼────────────────▼─────┐
    │              NVIDIA NIM Gateway              │
    │  (unified API for all 5 models)              │
    └─────┬────────┬────────┬────────┬────────┬───┘
          │        │        │        │        │
      ┌───▼──┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐ ┌─▼────┐
      │Embed │ │Rerank│ │Super │ │Reward│ │Safety│
      │ NIM  │ │ NIM  │ │ NIM  │ │ NIM  │ │ NIM  │
      └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
         │        │        │        │        │
    ┌────▼────────▼────────▼────────▼────────▼────┐
    │                  Qdrant                      │
    │            (Vector Database)                 │
    └─────────────────────────────────────────────┘
```

---

## Workflow Convention

```
main (protected)
  └── phase/1-project-setup
  └── phase/2-design-system
  └── phase/3-core-layout
  └── phase/4-nim-integration
  └── phase/5-repo-ingestion
  └── phase/6-ast-chunking
  └── phase/7-vector-store
  └── phase/8-examination-engine
  └── phase/9-score-report
  └── phase/10-testing
  └── phase/11-deployment
```

### Commit Convention
```
feat(scope): description          — new feature
fix(scope): description           — bug fix
refactor(scope): description      — code restructuring
chore(scope): description         — tooling/config
docs(scope): description          — documentation
test(scope): description          — tests
ui(scope): description            — UI/UX changes
nim(scope): description           — NIM/AI model integration
```

---

## PHASE 1: Project Setup & Foundation
**Branch:** `phase/1-project-setup`
**Estimated commits:** 8-10

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Initialize Next.js 15 project with TypeScript, App Router | `chore(init): initialize next.js 15 with typescript app router` |
| 2 | Configure Tailwind CSS v4 with Binance dark design tokens | `chore(tailwind): configure tailwind css v4 with binance dark tokens` |
| 3 | Install `npx getdesign@latest add binance` for design system | `chore(design): install binance design system via getdesign` |
| 4 | Set up ESLint + Prettier with strict rules | `chore(tooling): setup eslint and prettier with strict rules` |
| 5 | Create project directory structure | `chore(project): create app directory structure` |
| 6 | Set up path aliases (`@/components`, `@/lib`, `@/types`, etc.) | `chore(config): setup path aliases for cleaner imports` |
| 7 | Create base TypeScript types (`User`, `Repository`, `Chunk`, `Question`, `ScoreReport`, `ExamSession`, `NIMConfig`) | `types(base): define core project types and interfaces` |
| 8 | Set up environment variable schema (`@t3-oss/env-nextjs`) | `chore(env): setup environment variable validation with t3-env` |
| 9 | Create `.env.example` with NIM endpoints, Qdrant config | `chore(env): add env example with nim endpoints and qdrant config` |
| 10 | Add `package.json` scripts (dev, build, lint, typecheck, test) | `chore(scripts): add development and build scripts` |

### Files Created
```
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   ├── lib/
│   ├── types/
│   │   └── index.ts
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── ai/
│   └── backend/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .eslintrc.json
└── .prettierrc
```

### Verification
- [ ] `npm run dev` starts without errors
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] Binance dark theme renders correctly

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 2: Design System & Component Library (Binance Dark)
**Branch:** `phase/2-design-system`
**Estimated commits:** 10-12

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Configure Binance color palette (`#0B0E11`, `#1E2329`, `#2B3139`, `#F0B90B`, `#0ECB81`, `#F6465D`) | `ui(colors): configure binance dark color palette` |
| 2 | Create typography scale with monospace code blocks | `ui(typography): create typography scale with monospace code blocks` |
| 3 | Create `Button` component (variants: gold-primary, green-success, red-danger, ghost) | `ui(button): create binance-styled button with variants` |
| 4 | Create `Input` component with dark surface styling | `ui(input): create dark-themed input with validation` |
| 5 | Create `TextArea` component for answer input | `ui(textarea): create dark-themed textarea for answers` |
| 6 | Create `Card` component with `#1E2329` surface | `ui(card): create dark card component with surface styling` |
| 7 | Create `Modal` component with backdrop blur | `ui(modal): create modal with dark backdrop blur` |
| 8 | Create `Badge` component (status colors: green/red/gold/gray) | `ui(badge): create status badge component` |
| 9 | Create `ProgressBar` component with gold fill | `ui(progress): create progress bar with gold fill` |
| 10 | Create `Spinner` / `Skeleton` loading components | `ui(loading): create dark-themed loading states` |
| 11 | Create `CodeBlock` component with syntax highlighting + dark theme | `ui(code-block): create syntax-highlighted code block` |
| 12 | Create `ScoreGauge` component (circular, gold/green/red based on score) | `ui(score-gauge): create circular score gauge component` |

### Verification
- [ ] All components render on dark background
- [ ] Gold accent color used for primary actions
- [ ] Green for success, red for errors
- [ ] Code blocks have proper syntax highlighting
- [ ] Responsive at all breakpoints

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 3: Core Layout & Pages
**Branch:** `phase/3-core-layout`
**Estimated commits:** 10-14

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Create root layout with dark sidebar, header, content area | `ui(layout): create root layout with dark sidebar and header` |
| 2 | Create Landing Page (hero with GitHub URL input, feature cards) | `ui(landing): create landing page with hero and features` |
| 3 | Create Dashboard page (repo grid, session history, stats cards) | `ui(dashboard): create dashboard with repo grid and stats` |
| 4 | Create Repository Submit page (GitHub URL input, validation) | `ui(repo-submit): create repository submission page` |
| 5 | Create Repository Analysis page (progress, file tree, stats) | `ui(repo-analysis): create analysis progress page` |
| 6 | Create Exam Mode Selection page (3 mode cards: Viva/Interview/Review) | `ui(exam-select): create exam mode selection page` |
| 7 | Create Exam Session page (question card, answer textarea, timer) | `ui(exam-session): create exam session page` |
| 8 | Create Score Report page (radar chart, dimension scores, breakdown) | `ui(score-report): create score report with radar chart` |
| 9 | Create Study Guide page (struggling areas, hints, file refs) | `ui(study-guide): create personalized study guide page` |
| 10 | Create Exam History page (past sessions table) | `ui(exam-history): create exam history page` |
| 11 | Create Profile/Settings page | `ui(profile): create settings page` |
| 12 | Set up client-side routing and navigation guards | `ui(navigation): setup client routing and guards` |
| 13 | Create Zustand stores (exam, repo, user) | `state(global): setup zustand stores for state management` |
| 14 | Create mock API service layer | `feat(mock-api): create mock api for frontend development` |

### Verification
- [ ] All pages render correctly on dark theme
- [ ] Navigation between pages works
- [ ] Mock data populates all pages
- [ ] Responsive layout works

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 4: NVIDIA NIM Gateway Integration
**Branch:** `phase/4-nim-integration`
**Estimated commits:** 8-10

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Create NIM client abstraction (unified interface for all 5 models) | `nim(client): create unified nim gateway client abstraction` |
| 2 | Create Embedding NIM service (`llama-nemotron-embed-1b-v2`) | `nim(embedding): create embedding nim service with 768-dim vectors` |
| 3 | Create Reranking NIM service (`llama-nemotron-rerank-1b-v2`) | `nim(rerank): create reranking nim service for chunk scoring` |
| 4 | Create Examiner NIM service (`Llama-Nemotron-Super` 49B) | `nim(examiner): create examiner nim service for question generation` |
| 5 | Create Scoring NIM service (`Nemotron-4-340B-Reward`) | `nim(scoring): create reward nim service for answer scoring` |
| 6 | Create Safety NIM service (`Nemotron 3.5 Content Safety`) | `nim(safety): create content safety nim service for input filtering` |
| 7 | Create NIM health check and fallback logic | `nim(health): add nim health checks and model fallback logic` |
| 8 | Create NIM API routes (`/api/nim/embed`, `/api/nim/rerank`, etc.) | `nim(api): create nim api routes for model operations` |
| 9 | Set up NIM Docker compose for local development | `nim(dev): setup nim docker compose for local development` |

### Files Created
```
├── src/
│   ├── ai/
│   │   ├── nim/
│   │   │   ├── client.ts              (unified NIM client)
│   │   │   ├── embedding.ts           (llama-nemotron-embed-1b-v2)
│   │   │   ├── reranker.ts            (llama-nemotron-rerank-1b-v2)
│   │   │   ├── examiner.ts            (Llama-Nemotron-Super)
│   │   │   ├── scorer.ts              (Nemotron-4-340B-Reward)
│   │   │   ├── safety.ts              (Nemotron 3.5 Content Safety)
│   │   │   └── config.ts              (model configs, endpoints)
│   │   └── prompts/
│   │       ├── question-generation.ts
│   │       ├── answer-evaluation.ts
│   │       └── follow-up.ts
│   ├── app/
│   │   └── api/
│   │       └── nim/
│   │           ├── embed/
│   │           │   └── route.ts
│   │           ├── rerank/
│   │           │   └── route.ts
│   │           ├── health/
│   │           │   └── route.ts
│   │           └── [action]/
│   │               └── route.ts
├── docker/
│   └── docker-compose.nim.yml
```

### Verification
- [ ] NIM client connects to all 5 models
- [ ] Embedding endpoint returns 768-dim vectors
- [ ] Reranker rescores chunk arrays correctly
- [ ] Safety model flags malicious content
- [ ] Health check endpoint reports model status
- [ ] Docker compose starts all NIM containers

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 5: Backend Setup & Repository Ingestion
**Branch:** `phase/5-repo-ingestion`
**Estimated commits:** 10-12

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Set up Next.js API routes (`/api/repos`, `/api/exams`, `/api/scores`) | `feat(api): setup next.js api route structure` |
| 2 | Create GitHub API service (validate URL, fetch metadata) | `feat(github): create github api service for repo validation` |
| 3 | Create repository cloning service (simple-git) | `feat(ingestion): create git clone service for repo ingestion` |
| 4 | Create file walker with filtering (exclude node_modules, .git, binaries) | `feat(ingestion): create file walker with smart filtering` |
| 5 | Create language detection utility | `feat(ingestion): create language detection utility` |
| 6 | Create safety pre-filter (NIM Safety on every ingested file) | `nim(safety): add safety pre-filter to ingestion pipeline` |
| 7 | Create ingestion orchestrator (clone → filter → detect → AST → enrich → store) | `feat(ingestion): create full ingestion orchestrator` |
| 8 | Create ingestion API endpoint (`POST /api/repos/ingest`) | `feat(api): create repo ingestion api endpoint` |
| 9 | Create ingestion progress SSE endpoint | `feat(api): create ingestion progress streaming endpoint` |
| 10 | Connect frontend ingestion page to backend | `feat(integration): connect ingestion page to backend` |

### Verification
- [ ] GitHub URL validated correctly
- [ ] Repository clones successfully
- [ ] Files filtered properly
- [ ] Safety model checks each chunk
- [ ] Progress streams to frontend

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 6: AST Chunking & Enrichment
**Branch:** `phase/6-ast-chunking`
**Estimated commits:** 8-10

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Create Tree-sitter WASM integration for multi-language AST parsing | `feat(tree-sitter): integrate tree-sitter wasm for multi-language parsing` |
| 2 | Create Python AST parser (functions, classes, modules) | `feat(ast): create python ast parser for chunking` |
| 3 | Create JavaScript/TypeScript AST parser | `feat(ast): add javascript/typescript ast parser` |
| 4 | Create Java AST parser | `feat(ast): add java ast parser` |
| 5 | Create chunk normalization layer (consistent format across languages) | `refactor(chunking): normalize chunk format across languages` |
| 6 | Create LLM-powered chunk summarizer (NIM Super) | `nim(enrichment): create nim-powered chunk summarizer` |
| 7 | Create complexity scoring engine | `feat(metadata): create cyclomatic complexity scoring engine` |
| 8 | Create call graph builder (calls + called_by) | `feat(metadata): create call graph builder` |
| 9 | Create enrichment pipeline (chunk → metadata → summary → enriched chunk) | `feat(enrichment): create full enrichment pipeline` |

### Verification
- [ ] Python, JS/TS, Java codebases parse correctly
- [ ] Chunks are coherent (complete functions/classes)
- [ ] Summaries generated via NIM Super
- [ ] Complexity scores assigned
- [ ] Call graphs built

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 7: Vector Store & Retrieval Pipeline
**Branch:** `phase/7-vector-store`
**Estimated commits:** 8-10

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Set up Qdrant client (local development) | `feat(vector): setup qdrant client for local dev` |
| 2 | Create embedding pipeline (NIM Embed → 768-dim vectors → Qdrant) | `nim(embedding): create embedding pipeline with nim embed` |
| 3 | Create metadata indexing (file_path, chunk_type, complexity, language, dependency_count) | `feat(vector): create metadata indexing for filtered retrieval` |
| 4 | Create chunk ingestion into Qdrant | `feat(vector): create chunk ingestion pipeline into qdrant` |
| 5 | Create two-stage retrieval: vector search (top-10) → NIM Rerank (top-3) | `nim(retrieval): create two-stage retrieval with reranking` |
| 6 | Create priority-based retrieval (complexity + dependency sorting) | `feat(retrieval): create priority-based chunk retrieval` |
| 7 | Create retrieval API endpoint | `feat(api): create retrieval api endpoint` |
| 8 | Create vector store health check and stats endpoint | `feat(api): create vector store health check endpoint` |

### Verification
- [ ] Chunks embed via NIM Embed
- [ ] Chunks stored in Qdrant with metadata
- [ ] Two-stage retrieval works (vector → rerank)
- [ ] Top-3 chunks are highest quality
- [ ] Priority retrieval returns complex chunks first

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 8: Examination Engine (AI Agent)
**Branch:** `phase/8-examination-engine`
**Estimated commits:** 12-15

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Create exam session manager (start, pause, resume, end) | `feat(exam): create exam session state manager` |
| 2 | Create examiner prompts (Viva, Interview, Code Review personas) | `nim(prompts): create exam-mode examiner prompt templates` |
| 3 | Create question generator (retrieve top-3 chunks → NIM Super → grounded question) | `nim(exam): create rag-grounded question generator with nim super` |
| 4 | Create answer evaluator (developer answer + source code → NIM Reward → numerical scores) | `nim(eval): create answer evaluator with nemotron reward scoring` |
| 5 | Create feedback generator (NIM Super → human-readable feedback + follow-up) | `nim(feedback): create feedback generator with nim super` |
| 6 | Create follow-up question generator (weak answer → NIM Super → probe deeper) | `nim(exam): create follow-up question generator for weak answers` |
| 7 | Create agentic exam loop (question → answer → evaluate → follow-up/next) | `nim(exam): create agentic examination loop with nemotron pipeline` |
| 8 | Create exam API endpoints (`POST /api/exams/start`, `POST /api/exams/answer`) | `feat(api): create exam session api endpoints` |
| 9 | Create real-time exam streaming (SSE for questions) | `feat(api): create real-time exam question streaming` |
| 10 | Create safety pre-filter on user answers (NIM Safety) | `nim(safety): add safety pre-filter to user answers` |
| 11 | Connect frontend exam page to backend | `feat(integration): connect exam session page to backend` |
| 12 | Create exam timer and question counter UI | `ui(exam): add timer and question counter to exam page` |
| 13 | Create typing indicator and answer submission UX | `ui(exam): add typing indicator and answer submission flow` |

### Verification
- [ ] Questions grounded in actual code chunks (real file names, line numbers)
- [ ] NIM Super generates specific, probing questions
- [ ] NIM Reward scores answers numerically (accuracy, depth, awareness)
- [ ] Weak answers trigger NIM Super follow-up questions
- [ ] Safety model filters malicious inputs
- [ ] Exam modes produce different question styles
- [ ] Real-time streaming works

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 9: Score Report & Study Guide
**Branch:** `phase/9-score-report`
**Estimated commits:** 8-10

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Create score aggregation service (average per dimension) | `feat(scores): create score aggregation service` |
| 2 | Create score report generator (3-dimension breakdown) | `feat(reports): create score report generator` |
| 3 | Create study guide generator (struggling areas + hints via NIM Super) | `nim(reports): create personalized study guide generator with nim` |
| 4 | Create score report API endpoint (`GET /api/reports/[sessionId]`) | `feat(api): create score report api endpoint` |
| 5 | Create interactive radar chart (Recharts, gold/green/red) | `ui(charts): create interactive radar chart with binance colors` |
| 6 | Create question-by-question breakdown table | `ui(report): create question breakdown table` |
| 7 | Create study guide cards with file references | `ui(study-guide): create study guide cards with code refs` |
| 8 | Create score comparison across sessions | `ui(history): create session comparison view` |
| 9 | Create PDF export for score report | `feat(export): create pdf export for score reports` |
| 10 | Create shareable report link | `feat(share): create shareable report link generation` |

### Verification
- [ ] Score report shows 3 dimensions correctly
- [ ] Radar chart renders with Binance colors
- [ ] Study guide references specific files/functions
- [ ] PDF export downloads correctly
- [ ] Shareable link works

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 10: Testing & Quality Assurance
**Branch:** `phase/10-testing`
**Estimated commits:** 10-12

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Set up Vitest + React Testing Library | `chore(testing): setup vitest and react testing library` |
| 2 | Write unit tests for NIM client and all 5 model services | `test(nim): add unit tests for all nim model services` |
| 3 | Write unit tests for AST parsers (Python, JS, Java) | `test(ast): add unit tests for all ast parsers` |
| 4 | Write unit tests for chunking engine | `test(chunking): add unit tests for chunking engine` |
| 5 | Write unit tests for vector store operations | `test(vector): add unit tests for vector store operations` |
| 6 | Write unit tests for question generation | `test(exam): add unit tests for question generation` |
| 7 | Write unit tests for answer evaluation (NIM Reward scoring) | `test(eval): add unit tests for answer evaluation scoring` |
| 8 | Write integration tests for full exam flow | `test(integration): add integration tests for exam flow` |
| 9 | Write component tests for UI components | `test(ui): add component tests for ui components` |
| 10 | Write E2E tests with Playwright (critical paths) | `test(e2e): add playwright e2e tests for critical paths` |
| 11 | Add code coverage reporting | `chore(testing): add code coverage reporting` |
| 12 | Fix any failing tests and edge cases | `fix(tests): resolve failing tests and edge cases` |

### Verification
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code coverage > 70%

### 🛑 CHECKPOINT: Push branch, create PR, wait for sign-off

---

## PHASE 11: Deployment & Production Readiness
**Branch:** `phase/11-deployment`
**Estimated commits:** 8-10

### Tasks

| # | Task | Commit Message |
|---|------|----------------|
| 1 | Configure Vercel deployment settings | `chore(deploy): configure vercel deployment settings` |
| 2 | Set up database (PostgreSQL via Supabase/Neon for sessions) | `feat(database): setup postgresql for session persistence` |
| 3 | Set up Qdrant Cloud for production vector store | `feat(vector): setup qdrant cloud for production` |
| 4 | Configure NIM Docker containers for production self-hosting | `nim(deploy): configure nim containers for production self-hosting` |
| 5 | Create rate limiting middleware | `feat(security): add rate limiting middleware` |
| 6 | Create error boundary and global error handling | `fix(errors): add error boundary and global error handling` |
| 7 | Optimize bundle size and add performance monitoring | `chore(perf): optimize bundle size and add perf monitoring` |
| 8 | Add SEO metadata and Open Graph tags | `docs(seo): add seo metadata and open graph tags` |
| 9 | Final smoke test on production | `test(prod): final production smoke test` |
| 10 | README.md with NIM setup instructions | `docs(readme): create readme with nim setup guide` |

### Verification
- [ ] Deploys to Vercel successfully
- [ ] All pages load in < 3s
- [ ] NIM models respond correctly
- [ ] Rate limiting works
- [ ] Error pages render gracefully
- [ ] Environment variables are secure

### 🛑 FINAL CHECKPOINT: Push branch, create PR, wait for sign-off

---

## Total Estimated Commits: 105-125

| Phase | Commits | Description |
|-------|---------|-------------|
| 1 | 8-10 | Project Setup + Binance Design |
| 2 | 10-12 | Design System (Dark Theme) |
| 3 | 10-14 | Core Layout & Pages |
| 4 | 8-10 | NVIDIA NIM Gateway |
| 5 | 10-12 | Repo Ingestion + Safety |
| 6 | 8-10 | AST Chunking & Enrichment |
| 7 | 8-10 | Vector Store + Reranking |
| 8 | 12-15 | Examination Engine (5 Models) |
| 9 | 8-10 | Score Report & Study Guide |
| 10 | 10-12 | Testing |
| 11 | 8-10 | Deployment |
| **Total** | **105-125** | **Full Application** |

---

## NVIDIA NIM Model Summary

| Model | Role | When to Use |
|-------|------|-------------|
| `llama-nemotron-embed-1b-v2` | Embeds every code chunk | Every ingestion, 768-dim vectors |
| `llama-nemotron-rerank-1b-v2` | Re-scores chunks before exam | Every question generation, top-10 → top-3 |
| `Llama-Nemotron-Super` (49B) | Question generation + feedback | Production. Use Nano (8B) for dev |
| `Nemotron-4-340B-Reward` | Scores developer answers | Every answer evaluation, numerical scoring |
| `Nemotron 3.5 Content Safety` | Guards all inputs | Free, runs on every chunk + user answer |

### Development vs Production

| Model | Dev Environment | Production |
|-------|-----------------|------------|
| Embedding | NIM Free (build.nvidia.com) | Self-hosted NIM container |
| Reranking | NIM Free (build.nvidia.com) | Self-hosted NIM container |
| Examiner | `Llama-Nemotron-Nano` (8B, fast) | `Llama-Nemotron-Super` (49B, quality) |
| Scoring | `Nemotron-4-340B-Reward` | `Nemotron-4-340B-Reward` |
| Safety | `Nemotron 3.5 Content Safety` | `Nemotron 3.5 Content Safety` |

---

## Workflow Per Phase

```
1. Create branch:  git checkout -b phase/{n}-{name}
2. Implement tasks with atomic commits
3. Run verification checks (lint, typecheck, build, tests)
4. Push branch:    git push origin phase/{n}-{name}
5. Create PR:      gh pr create --base main
6. 🛑 WAIT for user sign-off
7. Merge PR after approval
8. Proceed to next phase
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + Binance Dark Theme |
| State | Zustand |
| UI Components | Custom library (getdesign binance) |
| Charts | Recharts |
| Code Highlighting | Shiki |
| Backend API | Next.js API Routes + Server Actions |
| AI Models | NVIDIA NIM (5 models) |
| Vector DB | Qdrant (local + cloud) |
| AST Parsing | Tree-sitter WASM |
| Database | PostgreSQL (Supabase/Neon) |
| Testing | Vitest + React Testing Library + Playwright |
| Deployment | Vercel + NIM Docker containers |
| Agent Skills | frontend-design, design-taste-frontend, web-design-guidelines, ui-ux-pro-max, data-designer, nemo-evaluator-plugin |

---

*Plan updated with NVIDIA NIM 5-model stack + Binance dark theme + 6 agent skills. Ready to begin Phase 1 when you give the go-ahead.*
