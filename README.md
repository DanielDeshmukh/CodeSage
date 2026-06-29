<p align="center">
  <img src="banner.png" alt="CodeSage Banner" width="100%" />
</p>


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

### Netlify (Recommended)

1. Push to GitHub repository
2. Import project in [Netlify Dashboard](https://app.netlify.com/)
3. Build settings are pre-configured via `netlify.toml`
4. Configure environment variables in Netlify dashboard
5. Deploy

### Self-Hosted with Docker

```bash
# Start all services (Qdrant + PostgreSQL + NIM containers)
docker compose -f docker/docker-compose.prod.yml up -d

# Start the app
npm run build
npm run start
```

### Self-Hosted without Docker

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
| `QDRANT_API_KEY` | No | - | Qdrant Cloud API key |
| `QDRANT_COLLECTION` | No | `codesage` | Qdrant collection name |
| `DATABASE_URL` | No | - | PostgreSQL connection string |
| `NIM_EMBED_MODEL` | No | `nvidia/llama-nemotron-embed-1b-v2` | Embedding model |
| `NIM_RERANK_MODEL` | No | `nvidia/llama-nemotron-rerank-1b-v2` | Reranking model |
| `NIM_EXAMINER_MODEL` | No | `nvidia/llama-nemotron-super-49b-v1` | Examiner model |
| `NIM_SCORER_MODEL` | No | `nvidia/nemotron-4-340b-reward` | Scorer model |
| `NIM_SAFETY_MODEL` | No | `nvidia/nemotron-3.5-content-safety` | Safety model |

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
- [Netlify](https://www.netlify.com/) for deployment
- [Qdrant](https://qdrant.tech/) for vector database
- [Tree-sitter](https://tree-sitter.github.io/) for AST parsing

## NIM Setup Guide

### Cloud API (Quickest)

1. Go to [build.nvidia.com](https://build.nvidia.com/)
2. Sign up / log in
3. Navigate to any model page (e.g., [NV-Embed-QA](https://build.nvidia.com/nvidia/nv-embedqa-e5-v5))
4. Click "Get API Key" → Generate
5. Copy the key and set as `NIM_API_KEY` in `.env.local`

### Self-Hosted Docker (Production)

Requires NVIDIA GPU with 16GB+ VRAM per model.

```bash
# Login to NVIDIA container registry
docker login nvcr.io

# Start all services
docker compose -f docker/docker-compose.prod.yml up -d

# Check health
docker compose -f docker/docker-compose.prod.yml ps
```

### Model Endpoints

| Service | Port | Endpoint |
|---------|------|----------|
| Embedding | 8080 | `http://localhost:8080/v1/embeddings` |
| Reranking | 8081 | `http://localhost:8081/v1/ranking` |
| Examiner | 8082 | `http://localhost:8082/v1/chat/completions` |
| Safety | 8083 | `http://localhost:8083/v1/chat/completions` |
| Qdrant | 6333 | `http://localhost:6333` |
| PostgreSQL | 5432 | `localhost:5432` |

---

<p align="center">
  Built with passion for developer education
</p>
