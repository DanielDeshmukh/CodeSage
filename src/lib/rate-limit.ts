interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, RateLimitEntry>();

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

const apiConfigs: Record<string, RateLimitConfig> = {
  "/api/nim/embed": { windowMs: 60 * 1000, maxRequests: 20 },
  "/api/nim/rerank": { windowMs: 60 * 1000, maxRequests: 15 },
  "/api/repos/ingest": { windowMs: 5 * 60 * 1000, maxRequests: 3 },
  "/api/exams/start": { windowMs: 60 * 1000, maxRequests: 10 },
};

function getConfig(pathname: string): RateLimitConfig {
  for (const [pattern, config] of Object.entries(apiConfigs)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  return defaultConfig;
}

function getCleanIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(
  identifier: string,
  pathname: string
): RateLimitResult {
  const config = getConfig(pathname);
  const now = Date.now();
  const key = `${identifier}:${pathname}`;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      limit: config.maxRequests,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.maxRequests,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  };
}

export function rateLimitMiddleware(request: Request): Response | null {
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/")) {
    return null;
  }

  const ip = getCleanIP(request);
  const result = checkRateLimit(ip, url.pathname);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetAt.toString(),
          "Retry-After": Math.ceil(
            (result.resetAt - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  return null;
}

export function getRateLimitHeaders(
  identifier: string,
  pathname: string
): Record<string, string> {
  const result = checkRateLimit(identifier, pathname);
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString(),
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60 * 1000);
