import type { NextConfig } from "next";
import { productionSecurityHeaders } from "./browser-security";

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return process.env.NODE_ENV === "production" ? [{ source: "/:path*", headers: productionSecurityHeaders() }] : [];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
