"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const examModes = [
  {
    tag: "Viva Voce",
    tagStyle: { background: "rgba(201,169,98,0.08)", color: "var(--color-gold)" },
    iconBg: "rgba(201,169,98,0.08)",
    iconBorder: "rgba(201,169,98,0.15)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    title: "Oral Defense",
    desc: "Simulates academic examination panels. Questions probe rationale, alternatives considered, and design intent — not just what you built, but why.",
    footer: "Start viva session",
  },
  {
    tag: "Technical Interview",
    tagStyle: { background: "rgba(72,187,120,0.08)", color: "var(--color-success)" },
    iconBg: "rgba(72,187,120,0.08)",
    iconBorder: "rgba(72,187,120,0.15)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    ),
    title: "Industry Hiring Loop",
    desc: "Replicates FAANG-style system design and code review rounds. Surfaces scalability gaps, edge cases, and algorithmic trade-offs in your actual codebase.",
    footer: "Start interview",
  },
  {
    tag: "Code Review",
    tagStyle: { background: "rgba(232,213,163,0.08)", color: "var(--color-gold-light)" },
    iconBg: "rgba(232,213,163,0.08)",
    iconBorder: "rgba(232,213,163,0.15)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    ),
    title: "Peer Review Sim",
    desc: "Generates senior-engineer-level feedback on architecture, coupling, test coverage, and documentation — framed as questions you should be able to answer.",
    footer: "Start review",
  },
];

const modelRows = [
  { name: "NV-Embed-QA", role: "Embedding", roleBg: "rgba(201,169,98,0.08)", roleColor: "var(--color-gold)", dotColor: "var(--color-gold)", cap: "Semantic code chunks" },
  { name: "NV-Rerank-QA", role: "Reranking", roleBg: "rgba(201,169,98,0.1)", roleColor: "var(--color-gold-light)", dotColor: "var(--color-gold-light)", cap: "Query relevance scoring" },
  { name: "Llama-3.3-70B", role: "Examiner", roleBg: "rgba(72,187,120,0.08)", roleColor: "var(--color-success)", dotColor: "var(--color-success)", cap: "Question generation" },
  { name: "Nemotron-340B", role: "Scorer", roleBg: "rgba(232,213,163,0.08)", roleColor: "var(--color-gold-light)", dotColor: "var(--color-gold-light)", cap: "Objective answer grading" },
  { name: "Llama-Guard-3", role: "Safety", roleBg: "rgba(252,129,129,0.08)", roleColor: "var(--color-danger)", dotColor: "var(--color-danger)", cap: "Content moderation" },
];

const questions = [
  {
    num: "Q 01 · AUTH.TS:10",
    text: "The catch block on line 14 swallows the error silently. If JWT verification fails, the function returns undefined — not a redirect. How does Next.js handle a middleware that returns undefined?",
    tags: [
      { label: "Security", bg: "rgba(252,129,129,0.1)", color: "var(--color-danger)" },
      { label: "Middleware", bg: "rgba(201,169,98,0.08)", color: "var(--color-gold)" },
    ],
    difficulty: "Hard",
    active: true,
  },
  {
    num: "Q 02 · AUTH.TS:7",
    text: "You're reading the token from req.cookies. What are the CSRF implications of cookie-based JWT vs Authorization header?",
    tags: [
      { label: "Security", bg: "rgba(252,129,129,0.1)", color: "var(--color-danger)" },
    ],
    difficulty: "Medium",
  },
  {
    num: "Q 03 · ENV",
    text: "You use a non-null assertion on process.env.JWT_SECRET!. What happens in production if this variable is unset, and how would you guard against it?",
    tags: [
      { label: "Config", bg: "rgba(232,213,163,0.08)", color: "var(--color-gold-light)" },
      { label: "TypeScript", bg: "rgba(201,169,98,0.08)", color: "var(--color-gold)" },
    ],
    difficulty: "Easy",
  },
  {
    num: "Q 04 · ARCHITECTURE",
    text: "This middleware runs at the edge but verify() from jsonwebtoken is a Node.js library. Why might this cause silent failures in Vercel Edge Runtime?",
    tags: [
      { label: "Architecture", bg: "rgba(201,169,98,0.1)", color: "var(--color-gold-light)" },
    ],
    difficulty: "Expert",
  },
];

const features = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
    title: "Direct GitHub import",
    desc: "Paste any public or private repo URL. CodeSage clones, parses, and analyzes — no local setup required.",
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    title: "AST-level analysis",
    desc: "Tree-sitter parses your code into an abstract syntax tree — questions reference actual line numbers, not summaries.",
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    title: "Personalized study guides",
    desc: "After each session, a scored breakdown maps your weak areas to specific concepts worth reviewing before the real exam.",
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: "Progress tracking",
    desc: "Historical session scores tracked across runs so you can see which areas have improved — and which need more work.",
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    title: "Objective scoring",
    desc: "The Nemotron reward model evaluates answers against rubrics — not vibes. Scores are reproducible and explainable.",
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Built-in content safety",
    desc: "Llama Guard 3 runs alongside the examiner, ensuring every generated question stays within appropriate academic scope.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="section-page relative isolate flex min-h-[100vh] flex-col items-center justify-center overflow-hidden px-12 pt-[120px] pb-20">
        <div className="dot-grid" />
        <div className="hero-glow" />
        <div className="relative z-[1] flex flex-col items-center">

        <div className="hero-badge">
          <span className="badge-dot" />
          5 NVIDIA NIM models · Live
        </div>

        <h1 className="text-center text-[72px] font-[800] leading-[1.05] tracking-[-2.5px] text-ink max-w-[800px] mb-6">
          Your codebase,<br />
          <span className="text-primary">interrogated.</span>
        </h1>

        <p className="text-center text-[18px] text-muted max-w-[520px] leading-[1.7] mb-10">
          CodeSage analyzes your GitHub repository and generates viva-ready questions that go beyond surface documentation — reaching into architecture, trade-offs, and your actual implementation.
        </p>

        <div className="flex items-center gap-3 mb-18">
          <Link href="/repositories/submit">
            <Button variant="primary" size="lg" className="gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              Connect repository
            </Button>
          </Link>
          <a href="#demo">
            <Button variant="secondary" size="lg">
              See a demo
            </Button>
          </a>
        </div>

        {/* Terminal */}
        <div className="terminal">
          <div className="terminal-bar">
            <span className="tbar-dot r" />
            <span className="tbar-dot y" />
            <span className="tbar-dot g" />
            <span className="tbar-title">codesage — viva session</span>
          </div>
          <div className="terminal-body">
            <span className="t-line"><span className="t-prompt">$ </span><span className="t-cmd">codesage analyze</span> <span className="t-output">github.com/you/your-project</span></span>
            <span className="t-line t-comment">&nbsp;</span>
            <span className="t-line"><span className="t-output">✦ Cloning repository...</span></span>
            <span className="t-line"><span className="t-output">✦ Parsing AST with Tree-sitter (</span><span className="t-blue">TypeScript</span><span className="t-output">, </span><span className="t-blue">Python</span><span className="t-output">)...</span></span>
            <span className="t-line"><span className="t-output">✦ Embedding </span><span className="t-warn">847 code chunks</span><span className="t-output"> via NV-Embed-QA...</span></span>
            <span className="t-line"><span className="t-output">✦ Generating examination with Llama-3.3-70B...</span></span>
            <span className="t-line t-comment">&nbsp;</span>
            <span className="t-line"><span className="t-success">✓ Ready · 12 questions across 4 difficulty levels</span></span>
            <span className="t-line t-comment">&nbsp;</span>
            <span className="t-line"><span className="t-prompt">Q1 </span><span className="t-output">Your </span><span className="t-blue">AuthMiddleware</span><span className="t-output"> validates JWT on every route, but your</span></span>
            <span className="t-line"><span className="t-output">   </span><span className="t-blue">WebSocket</span><span className="t-output"> handler skips it. Was this intentional? What</span></span>
            <span className="t-line"><span className="t-output">   are the implications for session hijacking? </span><span className="t-cursor" /></span>
          </div>
        </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ── MODES ── */}
      <section id="modes" className="section-page">
        <div className="section-inner">
          <div className="eyebrow">Examination Modes</div>
          <h2 className="section-title">Three ways to be tested</h2>
          <p className="section-sub">Each mode is calibrated to a different evaluation context, from academic defense to industry hiring loops.</p>

          <div className="mode-grid">
            {examModes.map((mode, i) => (
              <div key={i} className="mode-card">
                <div className="mode-icon" style={{ background: mode.iconBg, border: `1px solid ${mode.iconBorder}` }}>
                  {mode.icon}
                </div>
                <div className="mode-tag" style={mode.tagStyle}>{mode.tag}</div>
                <div className="mode-title">{mode.title}</div>
                <div className="mode-desc">{mode.desc}</div>
                <div className="mode-footer">
                  {mode.footer}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            ))}
          </div>

          <div className="stats-band">
            <div className="stat-cell">
              <div className="stat-number"><span className="accent">5</span></div>
              <div className="stat-label">Specialized NIM models</div>
            </div>
            <div className="stat-cell">
              <div className="stat-number">15<span className="accent">+</span></div>
              <div className="stat-label">Languages via Tree-sitter</div>
            </div>
            <div className="stat-cell">
              <div className="stat-number"><span className="accent">~</span>3s</div>
              <div className="stat-label">Time to first question</div>
            </div>
            <div className="stat-cell">
              <div className="stat-number">4</div>
              <div className="stat-label">Difficulty levels</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ── AI PIPELINE ── */}
      <section id="models" className="section-page pipeline-section">
        <div className="section-inner">
          <div className="pipeline-header">
            <div>
              <div className="eyebrow">AI Pipeline</div>
              <h2 className="section-title">Five models.<br />One examiner.</h2>
              <p className="section-sub" style={{ marginTop: 16 }}>No single model handles examination well. CodeSage routes each task to a specialist — embedding, ranking, generation, scoring, and safety run as a coordinated pipeline.</p>
            </div>
            <div>
              <table className="model-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Role</th>
                    <th>Task</th>
                  </tr>
                </thead>
                <tbody>
                  {modelRows.map((m, i) => (
                    <tr key={i}>
                      <td><span className="model-name">{m.name}</span></td>
                      <td>
                        <span className="model-role-badge" style={{ background: m.roleBg, color: m.roleColor }}>
                          <span className="role-dot" style={{ background: m.dotColor }} />{m.role}
                        </span>
                      </td>
                      <td><span className="model-cap">{m.cap}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pipeline-diagram">
            <svg viewBox="0 0 1060 180" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block" }}>
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill="var(--color-hairline)" />
                </marker>
              </defs>
              <pattern id="pg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="0.8" fill="var(--color-hairline-soft)" />
              </pattern>
              <rect width="1060" height="180" fill="url(#pg)" />
              <rect x="20" y="65" width="140" height="50" rx="6" fill="#0a0c0f" stroke="var(--color-hairline-soft)" strokeWidth="1" />
              <text x="90" y="86" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-muted)" textAnchor="middle" letterSpacing="0.5">INPUT</text>
              <text x="90" y="103" fontFamily="var(--font-sans), Inter, sans-serif" fontSize="13" fontWeight="600" fill="var(--color-ink)" textAnchor="middle">GitHub URL</text>
              <line x1="160" y1="90" x2="195" y2="90" stroke="var(--color-hairline)" strokeWidth="1" markerEnd="url(#arr)" />
              <rect x="197" y="55" width="140" height="70" rx="6" fill="#0a0c0f" stroke="var(--color-hairline-soft)" strokeWidth="1" />
              <text x="267" y="78" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-primary)" textAnchor="middle" letterSpacing="0.5">AST</text>
              <text x="267" y="97" fontFamily="var(--font-sans), Inter, sans-serif" fontSize="13" fontWeight="600" fill="var(--color-ink)" textAnchor="middle">Tree-sitter</text>
              <text x="267" y="113" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-muted)" textAnchor="middle">Parser</text>
              <line x1="337" y1="90" x2="372" y2="90" stroke="var(--color-hairline)" strokeWidth="1" markerEnd="url(#arr)" />
              <rect x="374" y="55" width="140" height="70" rx="6" fill="#0a0c0f" stroke="rgba(201,169,98,0.25)" strokeWidth="1" />
              <text x="444" y="78" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-primary)" textAnchor="middle" letterSpacing="0.5">NIM</text>
              <text x="444" y="97" fontFamily="var(--font-sans), Inter, sans-serif" fontSize="13" fontWeight="600" fill="var(--color-ink)" textAnchor="middle">NV-Embed</text>
              <text x="444" y="113" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-muted)" textAnchor="middle">→ Qdrant</text>
              <line x1="514" y1="90" x2="549" y2="90" stroke="var(--color-hairline)" strokeWidth="1" markerEnd="url(#arr)" />
              <rect x="551" y="45" width="140" height="90" rx="6" fill="#0a0c0f" stroke="rgba(72,187,120,0.25)" strokeWidth="1" />
              <text x="621" y="72" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-success)" textAnchor="middle" letterSpacing="0.5">EXAMINER</text>
              <text x="621" y="92" fontFamily="var(--font-sans), Inter, sans-serif" fontSize="13" fontWeight="600" fill="var(--color-ink)" textAnchor="middle">Llama 70B</text>
              <text x="621" y="109" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-muted)" textAnchor="middle">+ NV-Rerank</text>
              <text x="621" y="124" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="9" fill="var(--color-hairline)" textAnchor="middle">question gen</text>
              <line x1="691" y1="90" x2="726" y2="90" stroke="var(--color-hairline)" strokeWidth="1" markerEnd="url(#arr)" />
              <rect x="728" y="55" width="140" height="70" rx="6" fill="#0a0c0f" stroke="rgba(232,213,163,0.2)" strokeWidth="1" />
              <text x="798" y="78" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-gold-light)" textAnchor="middle" letterSpacing="0.5">SCORER</text>
              <text x="798" y="97" fontFamily="var(--font-sans), Inter, sans-serif" fontSize="13" fontWeight="600" fill="var(--color-ink)" textAnchor="middle">Reward Model</text>
              <text x="798" y="113" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-muted)" textAnchor="middle">objective grade</text>
              <line x1="868" y1="90" x2="903" y2="90" stroke="var(--color-hairline)" strokeWidth="1" markerEnd="url(#arr)" />
              <rect x="905" y="55" width="140" height="70" rx="6" fill="#0a0c0f" stroke="var(--color-hairline-soft)" strokeWidth="1" />
              <text x="975" y="78" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-muted)" textAnchor="middle" letterSpacing="0.5">OUTPUT</text>
              <text x="975" y="97" fontFamily="var(--font-sans), Inter, sans-serif" fontSize="13" fontWeight="600" fill="var(--color-ink)" textAnchor="middle">Report +</text>
              <text x="975" y="113" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-muted)" textAnchor="middle">Study Guide</text>
              <rect x="551" y="148" width="140" height="22" rx="4" fill="rgba(252,129,129,0.06)" stroke="rgba(252,129,129,0.15)" strokeWidth="0.5" />
              <text x="621" y="163" fontFamily="var(--font-mono), JetBrains Mono, monospace" fontSize="10" fill="var(--color-danger)" textAnchor="middle" letterSpacing="0.3">Llama-Guard-3 · Safety</text>
              <line x1="621" y1="135" x2="621" y2="148" stroke="rgba(252,129,129,0.2)" strokeWidth="0.5" strokeDasharray="2,2" />
            </svg>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ── DEMO ── */}
      <section id="demo" className="section-page demo-section">
        <div className="section-inner">
          <div className="eyebrow">Live Demo</div>
          <h2 className="section-title">Questions from real code</h2>
          <p className="section-sub">These questions were generated from an actual Next.js repository. The examiner read the source — not the README.</p>

          <div className="demo-grid">
            <div className="code-pane">
              <div className="pane-header">
                <span className="pane-title">src/middleware/auth.ts</span>
                <span className="lang-tag">TS</span>
              </div>
              <div className="code-body">
                <span className="ln"><span className="kw">import</span> <span className="op">{"{"} </span>NextRequest, NextResponse <span className="op">{"}"}</span> <span className="kw">from</span> <span className="st">&apos;next/server&apos;</span></span>
                <span className="ln"><span className="kw">import</span> <span className="op">{"{"} </span>verify <span className="op">{"}"}</span> <span className="kw">from</span> <span className="st">&apos;jsonwebtoken&apos;</span></span>
                <span className="ln"><span className="cm">{"// ← examined by CodeSage"}</span></span>
                <span className="ln">&nbsp;</span>
                <span className="ln"><span className="kw">export</span> <span className="kw">function</span> <span className="fn">authMiddleware</span><span className="op">(</span></span>
                <span className="ln">  <span className="nm">req</span><span className="op">:</span> NextRequest</span>
                <span className="ln"><span className="op">) {"{"}</span></span>
                <span className="ln">  <span className="kw">const</span> <span className="nm">token</span> <span className="op">=</span> req<span className="op">.</span><span className="fn">cookies</span><span className="op">.</span><span className="fn">get</span><span className="op">(</span><span className="st">&apos;session&apos;</span><span className="op">)</span></span>
                <span className="ln hi">  <span className="kw">if</span> <span className="op">(!</span>token<span className="op">)</span> <span className="kw">return</span> NextResponse<span className="op">.</span><span className="fn">redirect</span><span className="op">(</span><span className="st">&apos;/login&apos;</span><span className="op">)</span></span>
                <span className="ln">&nbsp;</span>
                <span className="ln">  <span className="kw">try</span> <span className="op">{"{"}</span></span>
                <span className="ln">    <span className="fn">verify</span><span className="op">(</span>token<span className="op">.</span>value<span className="op">,</span> process<span className="op">.</span>env<span className="op">.</span>JWT_SECRET<span className="op">!)</span></span>
                <span className="ln">    <span className="kw">return</span> NextResponse<span className="op">.</span><span className="fn">next</span><span className="op">()</span></span>
                <span className="ln">  <span className="op">{"}"}</span> <span className="kw">catch</span> <span className="op">{"{"}</span></span>
                <span className="ln hi">    <span className="cm">{"// silent fail — returns undefined"}</span></span>
                <span className="ln">  <span className="op">{"}"}</span></span>
                <span className="ln"><span className="op">{"}"}</span></span>
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>Session score</div>
                <div className="score-demo">
                  {[
                    { label: "Correctness", pct: 84, color: "var(--color-primary)" },
                    { label: "Depth", pct: 71, color: "var(--color-success)" },
                    { label: "Security", pct: 42, color: "var(--color-gold-light)" },
                    { label: "Architecture", pct: 68, color: "var(--color-gold)" },
                  ].map((s, i, arr) => (
                    <div key={i} className="score-row" style={{ marginBottom: i === arr.length - 1 ? 0 : 12 }}>
                      <span className="score-label">{s.label}</span>
                      <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div>
                      <span className="score-pct">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="questions-pane">
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 16 }}>Generated questions</div>
              {questions.map((q, i) => (
                <div key={i} className={`q-card${q.active ? " active" : ""}`}>
                  <div className="q-number">{q.num}</div>
                  <div className="q-text">{q.text}</div>
                  <div className="q-meta">
                    {q.tags.map((t, j) => (
                      <span key={j} className="q-tag" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                    ))}
                    <span className="difficulty-tag">{q.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="feature-strip">
            {features.map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-icon-wrap">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ── CTA ── */}
      <section className="cta-section isolate">
        <div className="dot-grid dot-grid-subtle" />
        <div className="cta-glow" />
        <div className="relative z-[1]">
        <h2 className="cta-title">Know your<br /><span className="text-primary">own code.</span></h2>
        <p className="cta-sub">Connect your repository and start your first viva session in under a minute.</p>
        <div className="cta-actions">
          <Link href="/repositories/submit">
            <Button variant="primary" size="lg" className="gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              Connect your repo
            </Button>
          </Link>
          <a href="https://github.com/DanielDeshmukh/CodeSage" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg" className="gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              View on GitHub
            </Button>
          </a>
        </div>
        </div>
      </section>
    </div>
  );
}
