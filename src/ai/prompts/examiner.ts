import type { ExamMode, Difficulty } from "@/backend/examination/session";

export interface PromptContext {
  repositoryName: string;
  language: string;
  filePath: string;
  chunkName: string;
  codeContent: string;
  summary?: string;
  complexity?: number;
  previousQuestions?: string[];
}

export function getExaminerSystemPrompt(mode: ExamMode): string {
  const personas: Record<ExamMode, string> = {
    viva: `You are an expert academic examiner conducting a viva voce examination. Your role is to assess the candidate's understanding of their codebase through thoughtful, probing questions. Focus on:
- Conceptual understanding of design decisions
- Architectural reasoning and trade-offs
- Deep knowledge of implementation details
- Ability to defend technical choices

Ask questions that test genuine understanding, not just memorization. Be encouraging but rigorous.`,

    interview: `You are a senior technical interviewer at a top tech company. Your goal is to assess the candidate's problem-solving abilities and technical depth through their codebase. Focus on:
- Implementation details and algorithms
- Edge cases and error handling
- Performance considerations
- Code quality and best practices

Ask questions that reveal how the candidate thinks about code and solves real problems.`,

    "code-review": `You are a senior developer conducting a thorough code review. Your goal is to identify strengths and areas for improvement in the codebase. Focus on:
- Code quality and readability
- Design patterns and architecture
- Potential bugs and security issues
- Performance and scalability
- Testing and documentation

Ask questions that help the candidate reflect on their code quality and learn best practices.`,
  };

  return personas[mode];
}

export function getQuestionGenerationPrompt(
  context: PromptContext,
  mode: ExamMode,
  difficulty: Difficulty,
  questionCount: number = 1
): string {
  const difficultyInstructions: Record<Difficulty, string> = {
    beginner: "Focus on basic concepts, simple implementations, and fundamental principles. Ask about what the code does and why.",
    intermediate: "Focus on design decisions, trade-offs, and deeper implementation details. Ask about how and why choices were made.",
    advanced: "Focus on architecture, scalability, edge cases, and optimization. Ask about complex scenarios and improvements.",
  };

  return `Generate ${questionCount} ${difficulty} level ${mode} examination question(s) based on the following code:

Repository: ${context.repositoryName}
File: ${context.filePath}
Function/Class: ${context.chunkName}
Language: ${context.language}
${context.summary ? `Summary: ${context.summary}` : ""}
${context.complexity ? `Complexity: ${context.complexity}` : ""}

Code:
\`\`\`${context.language}
${context.codeContent.slice(0, 2000)}
\`\`\`

${difficultyInstructions[mode === "viva" ? "intermediate" : mode === "interview" ? difficulty : "intermediate"]}

${context.previousQuestions?.length ? `Previous questions asked:\n${context.previousQuestions.join("\n")}\n\nGenerate a NEW question that explores different aspects.` : ""}

Return JSON array with:
[{
  "id": "unique-id",
  "question": "The question text",
  "type": "conceptual|implementation|architecture|best-practice",
  "difficulty": "${difficulty}",
  "expectedPoints": ["key point 1", "key point 2"],
  "followUp": "optional follow-up question"
}]`;
}

export function getAnswerEvaluationPrompt(
  question: string,
  answer: string,
  expectedPoints: string[],
  context: PromptContext
): string {
  return `Evaluate the following answer to a ${context.filePath} (${context.language}) examination question:

Question: ${question}

Candidate's Answer: ${answer}

Expected Key Points:
${expectedPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Provide detailed evaluation as JSON:
{
  "score": <0-100>,
  "breakdown": {
    "accuracy": <0-100>,
    "completeness": <0-100>,
    "clarity": <0-100>,
    "depth": <0-100>
  },
  "feedback": "Detailed constructive feedback",
  "matchedPoints": ["points the answer covered"],
  "missedPoints": ["points the answer missed"]
}`;
}

export function getFollowUpPrompt(
  previousQuestion: string,
  previousAnswer: string,
  context: PromptContext
): string {
  return `Based on the candidate's answer to a question about ${context.chunkName} in ${context.filePath}:

Previous Question: ${previousQuestion}
Candidate's Answer: ${previousAnswer}

Generate a follow-up question that:
1. Probes deeper into weak areas of the answer
2. Tests understanding of related concepts
3. Challenges the candidate to think more critically

Return JSON:
{
  "question": "The follow-up question",
  "reason": "Why this follow-up is important"
}`;
}

export function getFeedbackGenerationPrompt(
  evaluations: Array<{
    question: string;
    score: number;
    feedback: string;
  }>,
  overallScore: number,
  mode: ExamMode
): string {
  return `Generate comprehensive feedback for a ${mode} examination session:

Overall Score: ${overallScore}/100

Question Results:
${evaluations.map((e, i) => `${i + 1}. Score: ${e.score}/100 - ${e.feedback}`).join("\n\n")}

Provide:
1. Overall performance summary
2. Key strengths demonstrated
3. Areas for improvement
4. Specific recommendations for study
5. Encouragement and next steps

Return JSON:
{
  "summary": "Overall performance summary",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "encouragement": "Encouraging closing statement"
}`;
}
