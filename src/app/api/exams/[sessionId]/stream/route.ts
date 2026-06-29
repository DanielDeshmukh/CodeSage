import { NextRequest } from "next/server";
import { getExamLoop } from "@/backend/examination/exam-loop";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const examLoop = getExamLoop();

        // Set up callbacks for real-time updates
        examLoop.setCallbacks({
          onQuestion: (question) => {
            sendEvent({ type: "question", data: question });
          },
          onEvaluation: (evaluation) => {
            sendEvent({ type: "evaluation", data: evaluation });
          },
          onProgress: (progress) => {
            sendEvent({ type: "progress", data: progress });
          },
        });

        // Get initial status
        const status = examLoop.getExamStatus(sessionId);
        if (status) {
          sendEvent({ type: "status", data: status });
        }

        // Keep connection open for updates
        const keepAlive = setInterval(() => {
          sendEvent({ type: "heartbeat", timestamp: Date.now() });
        }, 30000);

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
          controller.close();
        });
      } catch (error) {
        sendEvent({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
