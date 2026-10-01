import type { NextConfig } from "next";
import { applicationCsp, productionSecurityHeaders } from "./browser-security";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Retain Next/Image's isolated document policy and also deny embedding.
    contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none'; sandbox",
  },
  async headers() {
    return process.env.NODE_ENV === "production"
      ? [
          {
            source: "/:path*",
            headers: [
              ...productionSecurityHeaders(),
              // Proxy replaces this policy with a per-request nonce on pages.
              { key: "Content-Security-Policy", value: applicationCsp() },
            ],
          },
        ]
      : [];
  },
};

export default nextConfig;
