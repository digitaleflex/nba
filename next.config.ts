import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Les images sont servies via /api/files/* (proxy interne) — on bypass l'optimizer Next.js
    // pour éviter les erreurs 400 sur les chemins locaux
    remotePatterns: [
      {
        protocol: "https",
        hostname: "access.signauxx.com",
        pathname: "/api/files/**",
      },
    ],
    // En dev local (stockage fichier), les images passent par l'API interne
    unoptimized: process.env.STORAGE_PROVIDER !== "s3",
  },
  async headers() {
    return [
      {
        // Les chunks buildés (_next/static) changent de nom (hash) à chaque build.
        // Un cache court (1h) + must-revalidate évite le flash sans style (FOUC)
        // tout en garantissant la fraîcheur après un déploiement. Le no-store
        // sur le HTML (via Traefik nba-nohtmlcache) assure que l'HTML référence
        // toujours les bons chunks.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // script-src: 'self' + unsafe-inline/eval (Next.js), Cloudflare insights, Cloudflare challenge bot protection
            // connect-src: 'self' + access.signauxx.com + Sentry + Cloudflare
            // frame-src: Cloudflare challenge needs to load in an iframe
            // style-src-elem/font-src: Google Fonts via Cloudflare
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://*.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "media-src 'self' data: blob: https:",
              "connect-src 'self' https://access.signauxx.com https://*.sentry.io https://*.cloudflare.com",
              "frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Force HTTP/2 (disable HTTP/3 advertisement).
            // Cloudflare HTTP/3 (QUIC) edge is returning 502 on RSC prefetch requests.
            // Empty alt-svc prevents the browser from upgrading to HTTP/3.
            key: "Alt-Svc",
            value: 'h2c=":443"; ma=1',
          },
          {
            // Permissions-Policy: disable unused features for better security
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/nextjs

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their names in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring-tunnel",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
