import { ApiClientError, type ApiErrorBody } from "./types";
import type { components } from "../generated/schema";

type CsrfTokenResponse = components["schemas"]["CsrfTokenResponse"];

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

let csrf: CsrfTokenResponse | null = null;
let csrfRequest: Promise<CsrfTokenResponse> | null = null;
let unauthorizedHandler: (() => void) | null = null;

const SESSION_CHANGING_PATHS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/api/v1/auth/register/teacher",
]);

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function resetCsrfToken(): void {
  csrf = null;
  csrfRequest = null;
}

export async function apiTransport(input: Request): Promise<Response> {
  const method = input.method.toUpperCase();
  const pathname = new URL(input.url).pathname;
  const unsafe = !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);
  const send = async (forceCsrf = false) => {
    const headers = new Headers(input.headers);

    if (unsafe) {
      const token = await getCsrfToken(forceCsrf);
      headers.set(token.headerName, token.token);
    }

    return fetch(new Request(input.clone(), { headers, credentials: "include" }));
  };

  let response = await send();

  if (response.status === 403 && unsafe && (await isCsrfFailure(response))) {
    response = await send(true);
  }

  if (response.ok && isSessionChangingPath(pathname)) {
    resetCsrfToken();
    void getCsrfToken().catch(() => resetCsrfToken());
  }

  if (response.status === 401 && !isExpectedAnonymousResponse(pathname)) {
    unauthorizedHandler?.();
  }

  return response;
}

export async function getCsrfToken(force = false): Promise<CsrfTokenResponse> {
  if (csrf && !force) {
    return csrf;
  }

  if (csrfRequest && !force) {
    return csrfRequest;
  }

  const request = loadCsrfToken();
  csrfRequest = request;

  try {
    csrf = await request;
    return csrf;
  } finally {
    if (csrfRequest === request) {
      csrfRequest = null;
    }
  }
}

async function loadCsrfToken(): Promise<CsrfTokenResponse> {
  const response = await fetch("/api/v1/auth/csrf", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as CsrfTokenResponse;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await apiTransport(new Request(path, {
    ...options,
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
  }));

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiClientError> {
  let body: ApiErrorBody;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = {
      code: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`,
      timestamp: new Date().toISOString(),
      traceId: response.headers.get("X-Trace-Id") ?? "",
      details: [],
    };
  }
  return new ApiClientError(response.status, body);
}

async function isCsrfFailure(response: Response): Promise<boolean> {
  try {
    const body = (await response.clone().json()) as Partial<ApiErrorBody>;
    return body.code === "CSRF_INVALID";
  } catch {
    return false;
  }
}

function isSessionChangingPath(pathname: string): boolean {
  return SESSION_CHANGING_PATHS.has(pathname)
    || /^\/api\/v1\/public\/student-invitations\/[^/]+\/accept$/.test(pathname);
}

function isExpectedAnonymousResponse(pathname: string): boolean {
  return pathname === "/api/v1/auth/login" || pathname === "/api/v1/auth/me";
}
