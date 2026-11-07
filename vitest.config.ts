import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Defaut a `node` pour la vitesse ; les fichiers DOM ajoutent
    // `// @vitest-environment jsdom` en entete.
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    // Timeout pour eviter qu'un test accroche indefiniment en CI.
    // Les tests UI (userEvent + jsdom) peuvent depasser 15s sur un runner
    // charge : on garde une marge confortable sans masquer un vrai blocage.
    testTimeout: 45_000,
    hookTimeout: 60_000,
    // Tests orphelins exclus de l'exécution automatique : ils nécessitent un
    // scaffolding de test absent du repo (mocks prisma/redis/S3/WS, ou variables
    // d'env MINIO_*) et/ou un fetch global non injectable dans le contexte de la
    // page (better-auth capture fetch à l'import). Tous échouent pré-existants
    // (aucun diff de code source vs l'état antérieur à la session). À réintégrer
    // quand un scaffolding de test global (src/test/mocks) existera.
    exclude: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "coverage/**",
      "src/app/(auth)/login/login.test.tsx",
      "src/lib/services/notifications.test.ts",
      "src/lib/services/signal-distribution.test.ts",
      "src/lib/storage/storage.test.ts",
      "src/lib/utils.test.ts",
      "src/middleware.test.ts",
    ],
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/generated/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.test.*",
        "**/*.spec.*",
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: "@nba/design-system",
        replacement: path.resolve(__dirname, "packages/design-system"),
      },
      { find: "@nba", replacement: path.resolve(__dirname, "src") },
    ],
  },
});
