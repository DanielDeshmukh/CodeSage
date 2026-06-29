import { NextRequest } from "next/server";
import { getIngestionOrchestrator } from "@/backend/ingestion/orchestrator";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoUrl = searchParams.get("repoUrl");

  if (!repoUrl) {
    return new Response(JSON.stringify({ error: "repoUrl is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const orchestrator = getIngestionOrchestrator();

        orchestrator.setProgressCallback((progress) => {
          sendEvent(progress);
        });

        sendEvent({ stage: "starting", message: "Starting ingestion..." });

        const result = await orchestrator.ingest(repoUrl);

        sendEvent({ stage: "complete", message: "Ingestion complete", result });
        controller.close();
      } catch (error) {
        sendEvent({
          stage: "error",
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
