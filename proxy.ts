import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { applicationCsp } from "./browser-security";

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const csp = applicationCsp(randomBytes(32).toString("base64"));
  const requestHeaders = new Headers(request.headers);
  // Always overwrite client input. Next.js reads this request header to apply
  // the nonce to its framework bundles and inline hydration/runtime scripts.
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  // A cached HTML body must never be paired with a different request's nonce.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Include navigations, RSC and prefetches, public shares, and error pages.
  // API responses and assets use the static policy without a script nonce.
  matcher: ["/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|favicon\\.png$|images/|templates/).*)"],
};
