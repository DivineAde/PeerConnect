import type { ApiErrorBody } from "@peerconnect/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

// Ensures at most one refresh request is ever in flight at a time — if
// three requests all 401 simultaneously, they share a single refresh
// call instead of racing three separate ones (and possibly rotating
// the refresh token three times, invalidating each other).
let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // Internal: prevents infinite refresh loops by only retrying once.
  _retried?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, _retried = false } = options;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !_retried && path !== "/api/auth/refresh" && path !== "/api/auth/login") {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retried: true });
    }
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // No JSON body (e.g. a network-level failure) — fall through to the
    // generic error below.
  }

  if (!res.ok) {
    const errorBody = payload as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      errorBody?.error?.code ?? "UNKNOWN_ERROR",
      errorBody?.error?.message ?? "Something went wrong. Please try again.",
      errorBody?.error?.fieldErrors
    );
  }

  return (payload as { data: T }).data;
}
