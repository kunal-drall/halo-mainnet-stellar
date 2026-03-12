import { NextResponse } from "next/server";

/**
 * Standardized API response helpers.
 */

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

export function unauthorizedResponse(message: string = "Unauthorized") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message: string = "Forbidden") {
  return errorResponse(message, 403);
}

export function notFoundResponse(message: string = "Not found") {
  return errorResponse(message, 404);
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return new NextResponse(
    JSON.stringify({
      error: "Too many requests",
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
