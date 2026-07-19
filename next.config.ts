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
  // CSP et headers de sécurité → gérés au niveau du reverse proxy (Traefik/Cloudflare).
  // Seul Alt-Svc reste ici car c'est un fix applicatif pour le bug HTTP/3 Cloudflare + RSC.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Alt-Svc",
            value: 'h2c=":443"; ma=1',
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
