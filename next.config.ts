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
  // Désactiver les source maps en production (Sentry les gère séparément
  // via le plugin withSentryConfig qui upload puis supprime les .map)
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      // HTML jamais en cache → le navigateur récupère toujours les bonnes refs CSS/JS.
      // Ne s'applique PAS à /_next/static (Next.js gère ses chunks en immutable).
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Alt-Svc", value: 'h2c=":443"; ma=1' },
        ],
      },
      // Cache long terme immutable pour le JS/CSS statique
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Content-Security-Policy (report-only en dev, enforce en prod)
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.telegram.org https://api.resend.com https://api.whatsapp.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
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
