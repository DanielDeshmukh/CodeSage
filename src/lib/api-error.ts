export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super("Rate limit exceeded", 429, "RATE_LIMITED");
    this.retryAfter = retryAfter;
  }
  retryAfter: number;
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(`${service} service error: ${originalError?.message || "Unknown"}`, 502, "EXTERNAL_SERVICE_ERROR");
  }
}

export function handleAPIError(error: unknown): Response {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (error instanceof Error) {
    if (error.message.includes("fetch")) {
      return new Response(
        JSON.stringify({
          error: "External service unavailable",
          code: "SERVICE_UNAVAILABLE",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response(
    JSON.stringify({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
