import type { NextConfig } from "next";

// Baseline security headers applied to every response. Note: this is a safe
// starting set — a strict script-src CSP (with nonces) is intentionally left
// for a dedicated pass so it doesn't break Next's inline runtime scripts.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Emit a self-contained `.next/standalone` server (minimal node_modules +
  // server.js) so the Docker runtime image stays small and needs no install.
  output: "standalone",

  // gamedig opens raw UDP/TCP sockets and must not be bundled by the
  // server compiler — keep it as a runtime Node dependency.
  serverExternalPackages: ["gamedig"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
