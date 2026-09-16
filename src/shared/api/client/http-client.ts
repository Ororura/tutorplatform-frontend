"use client";

import createClient, { type Middleware } from "openapi-fetch";

import { ApiClientError, type ApiErrorBody } from "./types";
import type { components, paths } from "../generated/schema";

type CsrfTokenResponse = components["schemas"]["CsrfTokenResponse"];

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

const SESSION_CHANGING_PATHS = new Set(["/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/auth/register/teacher"]);

let csrfToken: CsrfTokenResponse | null = null;

let csrfRequest: {
  generation: number;
  promise: Promise<CsrfTokenResponse>;
} | null = null;

let csrfGeneration = 0;

let unauthorizedHandler: (() => void) | null = null;

/**
 * Вызывается из React lifecycle для глобальной обработки
 * истёкшей/отсутствующей пользовательской сессии.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/**
 * Инвалидирует текущий CSRF.
 *
 * generation не позволяет старому уже выполняющемуся
 * запросу записать устаревший токен обратно в cache.
 */
export function resetCsrfToken(): void {
  csrfGeneration += 1;
  csrfToken = null;
  csrfRequest = null;
}

/**
 * Возвращает текущий CSRF token.
 *
 * Параллельные запросы используют один Promise,
 * чтобы не делать несколько GET /auth/csrf одновременно.
 *
 * force используется после CSRF_INVALID.
 */
export async function getCsrfToken(force = false): Promise<CsrfTokenResponse> {
  if (force) {
    /*
     * Если refresh уже выполняется, второй запрос
     * присоединяется к нему вместо создания нового.
     */
    if (csrfToken === null && csrfRequest?.generation === csrfGeneration) {
      return csrfRequest.promise;
    }

    resetCsrfToken();
  }

  if (csrfToken) {
    return csrfToken;
  }

  if (csrfRequest?.generation === csrfGeneration) {
    return csrfRequest.promise;
  }

  const generation = csrfGeneration;
  const promise = loadCsrfToken();

  csrfRequest = {
    generation,
    promise,
  };

  try {
    const token = await promise;

    /*
     * Пока выполнялся request могла произойти
     * login/logout/session rotation.
     *
     * В таком случае старый token не кешируем.
     */
    if (generation === csrfGeneration) {
      csrfToken = token;
    }

    return token;
  } finally {
    if (csrfRequest?.promise === promise) {
      csrfRequest = null;
    }
  }
}

/**
 * Используем native fetch напрямую.
 *
 * Через apiTransport этот запрос пускать нельзя,
 * иначе получение CSRF само потребует CSRF.
 */
async function loadCsrfToken(): Promise<CsrfTokenResponse> {
  const response = await globalThis.fetch("/api/v1/auth/csrf", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as CsrfTokenResponse;
}

/**
 * Низкоуровневый browser transport.
 *
 * openapi-fetch будет использовать его вместо native fetch.
 */
export const apiTransport: typeof fetch = async (input, init) => {
  const request = new Request(input, {
    ...(init ?? {}),
    credentials: "include",
  });

  const method = request.method.toUpperCase();
  const pathname = new URL(request.url).pathname;

  const unsafe = !SAFE_METHODS.has(method);

  const send = async (forceCsrf = false): Promise<Response> => {
    const headers = new Headers(request.headers);

    if (unsafe) {
      const csrf = await getCsrfToken(forceCsrf);

      headers.set(csrf.headerName, csrf.token);
    }

    /*
     * Используем clone(), потому что body Request является stream.
     *
     * Это позволяет безопасно повторить request один раз
     * после CSRF_INVALID.
     */
    const outgoingRequest = new Request(request.clone(), {
      headers,
      credentials: "include",
    });

    return globalThis.fetch(outgoingRequest);
  };

  let response = await send();

  /*
   * Повторяем запрос только для конкретной CSRF ошибки.
   *
   * Обычный 403 повторять нельзя.
   */
  if (response.status === 403 && unsafe && (await isCsrfFailure(response))) {
    response = await send(true);
  }

  /*
   * Login/logout/register могут изменить server session.
   *
   * Текущий CSRF больше не считаем валидным.
   * Новый будет получен лениво перед следующим unsafe request.
   */
  if (response.ok && isSessionChangingPath(pathname)) {
    resetCsrfToken();
  }

  /*
   * Глобальный session handler.
   *
   * auth/me может законно вернуть 401 для anonymous user.
   * login может вернуть 401 из-за неверных credentials.
   */
  if (response.status === 401 && !isExpectedAnonymousResponse(pathname)) {
    unauthorizedHandler?.();
  }

  return response;
};

/**
 * HTTP error → ApiClientError.
 *
 * Этот middleware выполняется уже после apiTransport,
 * поэтому CSRF retry к этому моменту завершён.
 */
const apiErrorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      throw await toApiError(response);
    }
  },
};

/**
 * Основной HTTP client приложения.
 *
 * URL, params, body и response выводятся
 * непосредственно из OpenAPI paths.
 */
export const api = createClient<paths>({
  fetch: apiTransport,
});

api.use(apiErrorMiddleware);

/**
 * Преобразует backend ApiErrorBody в application error.
 */
async function toApiError(response: Response): Promise<ApiClientError> {
  let body: ApiErrorBody;

  try {
    /*
     * clone() оставляет оригинальный Response нетронутым.
     */
    body = (await response.clone().json()) as ApiErrorBody;
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
  return (
    SESSION_CHANGING_PATHS.has(pathname) || /^\/api\/v1\/public\/student-invitations\/[^/]+\/accept$/.test(pathname)
  );
}

function isExpectedAnonymousResponse(pathname: string): boolean {
  return pathname === "/api/v1/auth/login" || pathname === "/api/v1/auth/me";
}
