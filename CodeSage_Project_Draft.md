# CodeSage — Project Draft
### AI-powered codebase examiner for viva, project review, and technical interview preparation

---

## 1. Project Overview

CodeSage is an AI-powered examination system that ingests a GitHub repository and tests how well a developer understands their own codebase. Unlike traditional RAG systems that answer questions *about* code, CodeSage flips the model — it reads the code first, then interrogates the developer with questions grounded in what it finds.

The core problem it solves is real: developers build projects, submit them, and then struggle to defend them in viva panels, project reviews, or technical interviews because they never practiced explaining their own decisions out loud. CodeSage simulates that pressure — an AI examiner that has already studied your code and is ready to probe it.

**Target users:**
- Students preparing for semester project vivas
- Developers preparing for portfolio-based technical interviews
- Teams wanting to audit how well members understand a shared codebase

**What makes it different from a codebase chatbot:**
A chatbot answers your questions. CodeSage asks you questions — and grades your answers based on the actual code it has already read.

---

## 2. Problem Statement

When a developer submits a project for review, they face three common failure scenarios:

1. **The viva panel** asks about a specific function or design choice and the developer cannot explain it clearly — even though they wrote it.
2. **The interviewer** treats a GitHub repo as a portfolio and asks "why did you make this decision?" or "how would you scale this?" — questions the developer didn't prepare for.
3. **The code review** points at a specific file and asks the developer to walk through the logic — and they realize they've forgotten how it works.

CodeSage prepares developers for all three scenarios by simulating them before they happen.

---

## 3. How RAG Powers CodeSage

This is where CodeSage's architecture gets genuinely interesting. RAG (Retrieval-Augmented Generation) is typically used to help an AI answer user questions by pulling in relevant documents. CodeSage uses RAG for the opposite purpose — to help the AI *generate grounded questions* that are specific to the user's actual code.

### 3.1 The RAG Pipeline — Step by Step

#### Step 1: Repository Ingestion

The user provides a GitHub URL. CodeSage clones the repo and begins parsing.

```
GitHub URL → git clone → file walker → language detection
```

Not all files are treated equally. CodeSage filters out:
- Auto-generated files (`node_modules/`, `__pycache__/`, `.git/`)
- Config boilerplate (`package-lock.json`, `.env.example`)
- Binary assets

What remains is source code, documentation, and configuration files that reflect actual developer decisions.

#### Step 2: AST-Based Chunking (the critical differentiator)

This is where CodeSage diverges from naive RAG systems. Most RAG pipelines chunk text by character count — splitting at every 500 characters regardless of meaning. This destroys code semantics.

CodeSage uses **Abstract Syntax Tree (AST) parsing** to chunk code at meaningful boundaries:

- Each **function** becomes one chunk
- Each **class** becomes one chunk (with its methods as sub-chunks)
- Each **module-level block** (imports, constants, global config) becomes its own chunk
- **Docstrings and comments** are attached to their parent function/class chunk

**Why this matters for question generation:**

When the AI later retrieves a chunk to generate a question, it gets a complete, coherent unit of logic — not a fragment that starts mid-function and ends mid-condition. A question like "explain your `authenticate_user()` function" is only possible if the entire function was preserved as one retrievable unit.

```python
# Naive chunking (bad for code):
chunk_1 = "def authenticate_user(username, passw"
chunk_2 = "ord):\n    user = db.query(User).filte"

# AST-based chunking (CodeSage approach):
chunk = {
    "type": "function",
    "name": "authenticate_user",
    "file": "auth/views.py",
    "start_line": 42,
    "end_line": 67,
    "content": "def authenticate_user(username, password):\n    ...",
    "docstring": "Validates credentials and returns JWT token",
    "calls": ["db.query", "bcrypt.check_password_hash", "jwt.encode"],
    "called_by": ["login_view", "api_login"]
}
```

The `calls` and `called_by` fields are extracted from the AST as well — this gives CodeSage a **call graph** that enables questions about code flow, not just individual functions.

#### Step 3: Metadata Enrichment

Each chunk is enriched with natural language context before embedding. This is important because embedding "def authenticate_user(username, password):" alone produces a mediocre vector. Enriching it produces a much more semantically useful one.

```python
enriched_chunk = f"""
File: auth/views.py (line 42-67)
Type: function
Name: authenticate_user
Calls: db.query, bcrypt.check_password_hash, jwt.encode
Called by: login_view, api_login

{raw_source_code}

Summary: This function handles user authentication by querying the 
database, verifying the password hash, and returning a JWT token.
"""
```

The summary is auto-generated by a lightweight LLM call during indexing. This makes the chunk retrievable by natural language queries even if the source code uses cryptic variable names.

#### Step 4: Embedding and Vector Storage

Each enriched chunk is passed through a code-optimized embedding model and stored in a vector database with full metadata.

```
enriched_chunk → CodeBERT / text-embedding-3-small → vector
vector + metadata → ChromaDB / Qdrant
```

Metadata stored alongside each vector:
- `file_path` — where in the repo this lives
- `chunk_type` — function, class, module, config
- `complexity_score` — cyclomatic complexity (flags interesting chunks)
- `has_todos` — marks unfinished code
- `dependency_count` — how many other chunks depend on this one
- `language` — Python, JS, etc.

The `complexity_score` and `dependency_count` fields are particularly important — CodeSage uses them to **prioritize which chunks to ask questions about**. High complexity + high dependency = high-value examination target.

#### Step 5: Question Generation via RAG

This is the core of what makes CodeSage a RAG system. When the examination begins, CodeSage does not ask pre-written generic questions. It retrieves real chunks from the user's codebase and uses them as grounding context to generate highly specific questions.

**Retrieval strategy for question generation:**

Unlike a typical RAG query ("find me chunks relevant to what the user asked"), CodeSage uses **examiner-driven retrieval**. The retrieval query is not based on user input — it's based on what the AI examiner wants to probe next.

```python
# Phase 1: Retrieve high-complexity, high-dependency chunks first
# These are the most defensible parts of the codebase
priority_chunks = vector_db.query(
    filter={"complexity_score": {"$gt": 5}, "chunk_type": "function"},
    sort_by="dependency_count",
    top_k=10
)

# Phase 2: Generate a question grounded in the retrieved chunk
question_prompt = f"""
You are a strict viva examiner. You have read this code from the student's project:

FILE: {chunk['file_path']} (line {chunk['start_line']}-{chunk['end_line']})
---
{chunk['content']}
---

Generate ONE specific, probing question about this code that tests whether 
the student truly understands what they built. The question must:
- Reference the specific file and function by name
- Probe a non-obvious design decision or potential weakness
- Be answerable only by someone who actually wrote and understands this code

Do not ask trivial questions like "what does this function do?"
Ask questions like "why did you choose X over Y here?" or "what happens 
if Z edge case occurs in this function?"
"""
```

The generated question is grounded in real code — it names real files, real functions, real line numbers. This is what makes CodeSage feel like a genuine examiner rather than a generic quiz bot.

#### Step 6: Answer Evaluation via RAG

When the developer answers a question, CodeSage evaluates the answer using the same retrieved chunk as ground truth.

```python
evaluation_prompt = f"""
The student was asked: "{question}"

The student answered: "{student_answer}"

The actual code being discussed:
---
{chunk['content']}
---

Evaluate the student's answer on three criteria:
1. Accuracy (0-10): Does the answer correctly describe what the code does?
2. Depth (0-10): Does the answer explain WHY, not just WHAT?
3. Awareness (0-10): Does the answer acknowledge limitations, tradeoffs, or edge cases?

Return a score for each and a one-sentence feedback comment. 
If the answer is vague or incorrect, generate a follow-up question 
that probes the specific gap in their understanding.
"""
```

The RAG-grounded evaluation means the AI cannot be fooled by confident-sounding but wrong answers — it has the source code right there to check against.

#### Step 7: Follow-up Question Generation (Agentic Loop)

If the developer gives a weak or vague answer, CodeSage does not move on. It enters a follow-up loop using LangGraph:

```
Answer received
     ↓
Evaluate answer (RAG-grounded)
     ↓
Score < threshold?
   YES → Retrieve related chunk → Generate follow-up question → Loop
   NO  → Mark as understood → Move to next chunk
```

This is what distinguishes CodeSage from a simple quiz app. The examiner adapts to the developer's responses — just like a real viva panel would.

---

## 4. Exam Modes

### 4.1 Viva Mode
Simulates a formal project defense. The AI acts as a panel of two examiners — one focused on architecture and design decisions, one focused on implementation details and edge cases. Questions progress from high-level ("explain your overall system design") down to specific functions ("walk me through this authentication flow").

### 4.2 Interview Mode
Treats the repo as portfolio work. Questions mirror what a senior engineer would ask in a technical interview: "why did you make this design choice?", "how would this perform under load?", "what would you refactor if you had another week?". The AI uses the codebase to generate scenario-based questions grounded in the actual implementation.

### 4.3 Code Review Mode
Simulates a tech lead doing a live code review. The AI points at specific files and line ranges and asks the developer to explain the logic, identify potential bugs, or justify their approach. This is the most granular mode and the hardest to bluff through.

---

## 5. Score Report

At the end of each session, CodeSage generates a score report across three dimensions:

| Dimension | What it measures |
|---|---|
| Architecture understanding | Can you explain your system's design and the reasoning behind major decisions? |
| Code-level detail | Can you walk through specific functions and explain what they do and why? |
| Scalability awareness | Do you understand the limitations and failure points of your implementation? |

Beyond the scores, CodeSage generates a **personalized study guide** — a list of the specific files and functions the developer struggled to explain, with hints and suggested reading grounded in their own codebase.

---

## 6. System Architecture

```
User Input (GitHub URL)
        │
        ▼
┌─────────────────────┐
│   Ingestion Layer   │
│  - git clone        │
│  - file filter      │
│  - AST parser       │
│  - metadata extract │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Enrichment Layer   │
│  - LLM summarizer   │
│  - call graph build │
│  - complexity score │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Vector Store      │
│  ChromaDB / Qdrant  │
│  + metadata index   │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────────────┐
│ Query  │ │  Examiner Agent    │
│ Engine │ │  (LangGraph)       │
│        │ │  - retrieve chunk  │
│        │ │  - gen question    │
│        │ │  - eval answer     │
│        │ │  - follow-up loop  │
└────────┘ └────────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   Score Report   │
         │ + Study Guide    │
         └──────────────────┘
```

---

## 7. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Repo ingestion | PyGitHub + gitpython | Clone and traverse repos programmatically |
| AST parsing | Python `ast` module + Tree-sitter | Language-aware chunk extraction |
| Complexity analysis | `radon` (Python) | Cyclomatic complexity scoring per function |
| Embeddings | `text-embedding-3-small` or CodeBERT | Code-optimized semantic vectors |
| Vector database | ChromaDB (local) / Qdrant (production) | Metadata-filtered retrieval |
| LLM | Claude claude-sonnet-4-6 / GPT-4o | Question generation and answer evaluation |
| Orchestration | LangChain + LangGraph | RAG pipeline and agentic follow-up loop |
| Evaluation | RAGAS | Measure retrieval quality and answer faithfulness |
| Backend | FastAPI | REST endpoints for ingestion and session management |
| Frontend | React + Tailwind | Session UI, score report, study guide display |

---

## 8. What Makes This a Strong Semester Project

### Technical depth
The project requires solving non-trivial engineering problems: AST-based chunking, call graph extraction, metadata-weighted retrieval, and an agentic follow-up loop. Each of these is a research-grade challenge on its own.

### Clear novelty
Most RAG systems retrieve information to help a user. CodeSage retrieves information to test a user. This inversion of the RAG use case is the project's core contribution — and it's genuinely new enough to write a compelling abstract about.

### Measurable outcomes
The score report and study guide are concrete, evaluatable deliverables. A project reviewer can look at the output and immediately understand what the system did and whether it worked.

### Evaluation story
Using RAGAS to measure retrieval precision and answer faithfulness gives the project a rigorous evaluation component — the kind of thing that separates a demo from a research contribution.

### Real utility
This is a tool that developers would actually use. The problem it solves (preparing for vivas and interviews) is universally felt and currently underserved.

---

## 9. Limitations and Future Scope

**Current limitations:**
- AST parsing is language-specific — initial version supports Python only; JavaScript and Java support can be added in later sprints
- Very large repositories (50k+ lines) require chunking time optimization
- Answer evaluation is LLM-dependent and can itself hallucinate — needs a human-in-the-loop validation layer for high-stakes use

**Future scope:**
- Multi-language support via Tree-sitter (supports 40+ languages)
- IDE plugin version (VS Code extension) for in-editor examination
- Team mode — multiple developers examined on a shared codebase with comparative scoring
- Temporal mode — re-examine the same developer on the same repo after two weeks to measure knowledge retention
- Integration with GitHub Classroom for academic institutions

---

## 10. Summary

CodeSage is a RAG system with a twist. It uses retrieval not to answer questions, but to ask them — grounding every question in the actual code the developer wrote, evaluating every answer against the same source, and adapting its follow-up based on the developer's responses. The result is an AI examiner that feels like it has genuinely studied your project — because it has.

The RAG pipeline is the backbone of the entire experience: without it, CodeSage is just a generic quiz bot. With it, every question is specific, every evaluation is grounded, and every score report maps directly back to real files and real functions in the developer's own repository.
