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

  // Cache Components (Next 16): pages are dynamic by default and we opt specific
  // reads into the static shell with `use cache`. This powers Partial
  // Prerendering — the catalog chrome is prerendered and served instantly while
  // live status streams into Suspense holes, killing the post-hydration flash.
  cacheComponents: true,

  images: {
    // Add a 5120 candidate above the default 3840 ceiling so the full-bleed
    // hero stays crisp on 21:9+ / ultrawide displays instead of upscaling a
    // 3840 render. (Defaults otherwise preserved.)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840, 5120],
    // Next 16 requires opting into any quality above the default 75. The hero
    // art is rendered at 90 so the featured server reads sharp at large sizes.
    qualities: [75, 90],
  },

  // gamedig opens raw UDP/TCP sockets and must not be bundled by the
  // server compiler — keep it as a runtime Node dependency.
  serverExternalPackages: ["gamedig"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
