import { applicationCsp, productionSecurityHeaders } from "../../../browser-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Transport headers describe a single connection and must not cross the proxy.
function transportHeaders(headers: Headers) {
  const copy = new Headers(headers);
  for (const name of (copy.get("connection") ?? "").split(",")) {
    if (name.trim()) copy.delete(name.trim());
  }
  for (const name of [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
  ])
    copy.delete(name);
  return copy;
}

async function forward(request: Request) {
  const incoming = new URL(request.url);
  // Resolve only against the configured backend, never a user-provided origin.
  const target = new URL(process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080");
  target.pathname = `${target.pathname.replace(/\/$/, "")}${incoming.pathname}`;
  target.search = incoming.search;
  const headers = transportHeaders(request.headers);
  headers.set("x-forwarded-host", incoming.host);
  headers.set("accept-encoding", "identity");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    duplex: "half",
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
  };

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    // Do not disclose the internal URL or network failure details.
    upstream = new Response("Bad Gateway", { status: 502 });
  }
  const responseHeaders = transportHeaders(upstream.headers);
  // Fetch transparently decompresses responses, even if the backend ignores identity.
  if (responseHeaders.has("content-encoding")) {
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
  }
  if (process.env.NODE_ENV === "production") {
    for (const { key, value } of productionSecurityHeaders()) responseHeaders.set(key, value);
    responseHeaders.set("Content-Security-Policy", applicationCsp());
  }
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export {
  forward as GET,
  forward as HEAD,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
  forward as OPTIONS,
};
