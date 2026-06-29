<p align="center">
  <img src="banner.png" alt="CodeSage Banner" width="100%" />
</p>

<h1 align="center">CodeSage</h1>

<p align="center">
  <strong>AI-Powered Codebase Examiner for Viva & Interview Preparation</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#ai-models">AI Models</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#development">Development</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Overview

CodeSage is an AI-powered platform that helps developers prepare for viva voce examinations, project reviews, and technical interviews by analyzing their codebases and generating intelligent, context-aware questions. Using a stack of 5 specialized NVIDIA NIM models, CodeSage deeply understands your code structure, architecture, and implementation details to create personalized examination experiences.

## Features

### Examination Modes

| Mode | Description |
|------|-------------|
| **Viva Voce** | Traditional oral examination simulating academic defense scenarios |
| **Technical Interview** | Industry-style coding interview with problem-solving focus |
| **Code Review** | Peer review simulation with architectural feedback |

### Core Capabilities

- **GitHub Integration** - Direct repository analysis via GitHub URL
- **Deep Code Understanding** - AST parsing with Tree-sitter for multi-language support
- **Intelligent Question Generation** - Context-aware questions tailored to your codebase
- **Objective Scoring** - AI-powered grading with detailed performance metrics
- **Study Guides** - Personalized learning paths based on identified weak areas
- **Progress Tracking** - Historical performance analytics across sessions

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [Binance Design System](DESIGN.md) | Dark theme UI components |

### Backend & AI

| Technology | Purpose |
|------------|---------|
| [NVIDIA NIM](https://build.nvidia.com/) | AI model inference |
| [Tree-sitter WASM](https://tree-sitter.github.io/) | Multi-language AST parsing |
| [Qdrant](https://qdrant.tech/) | Vector database |
| [Vercel AI SDK](https://sdk.vercel.ai/) | AI integration utilities |

## AI Models

CodeSage leverages 5 specialized NVIDIA NIM models for optimal performance:

| Model | Role | Capability |
|-------|------|------------|
| **NV-Embed-QA** | Embedding | Semantic code understanding |
| **NV-Rerank-QA** | Reranking | Query-document relevance |
| **Llama-3.3-70B-Instruct** | Examiner | Question generation |
| **Llama-Nemotron-70B-Reward** | Scorer | Objective answer evaluation |
| **Llama-Guard-3-8B** | Safety | Content moderation |

### Model Configuration

```bash
# Development (lightweight)
NIM_MODEL_EXAMINER=Llama-3.3-70B-Instruct

# Production (full capability)
NIM_MODEL_EXAMINER=Llama-Nemotron-Super-49B-V1
```

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [NVIDIA NIM API Key](https://build.nvidia.com/) (for AI features)
- [GitHub Account](https://github.com/) (for repository access)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/DanielDeshmukh/CodeSage.git
   cd CodeSage
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your API keys:

   ```env
   # Required
   NIM_API_KEY=your_nvidia_nim_api_key

   # Optional
   GITHUB_TOKEN=your_github_token
   QDRANT_URL=http://localhost:6333
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open application**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript checks |
| `npm run test` | Run tests with Vitest |

### Project Structure

```
CodeSage/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Dashboard
│   │   ├── repositories/      # Repository management
│   │   ├── exam/              # Exam interface
│   │   └── results/           # Score reports & study guides
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   └── features/          # Feature-specific components
│   ├── backend/
│   │   ├── ast/               # Tree-sitter AST parser
│   │   └── nim/               # NVIDIA NIM gateway
│   ├── services/              # API services
│   ├── store/                 # Zustand stores
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── docs/                      # Documentation
```

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
├─────────────────────────────────────────────────────────┤
│  Landing → Dashboard → Repository Submit → Exam → Report │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   NIM Gateway (5 Models)                 │
├────────────────┬───────────┬────────────┬───────────────┤
│   NV-Embed     │ NV-Rerank │ Examiner   │  Scorer       │
│   (Embedding)  │ (Rerank)  │ (70B)      │  (Reward)     │
└────────────────┴───────────┴────────────┴───────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Backend Services                           │
├────────────────┬──────────────────┬──────────────────────┤
│  Tree-sitter   │  Qdrant Vector   │  GitHub API          │
│  AST Parser    │  Store           │  Integration         │
└────────────────┴──────────────────┴──────────────────────┘
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub repository
2. Import project in [Vercel Dashboard](https://vercel.com/)
3. Configure environment variables
4. Deploy

### Docker

```bash
docker build -t codesage .
docker run -p 3000:3000 codesage
```

### Self-Hosted

```bash
npm run build
npm run start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NIM_API_KEY` | Yes | - | NVIDIA NIM API key |
| `GITHUB_TOKEN` | No | - | GitHub API token |
| `QDRANT_URL` | No | `http://localhost:6333` | Qdrant instance URL |
| `NIM_MODEL_EXAMINER` | No | `Llama-3.3-70B-Instruct` | Examiner model |
| `NIM_MODEL_SCORER` | No | `Llama-Nemotron-70B-Reward` | Scorer model |

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [NVIDIA NIM](https://build.nvidia.com/) for AI model inference
- [Vercel](https://vercel.com/) for Next.js framework
- [Qdrant](https://qdrant.tech/) for vector database
- [Tree-sitter](https://tree-sitter.github.io/) for AST parsing

---

<p align="center">
  Built with passion for developer education
</p>
