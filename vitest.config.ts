import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
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
    alias: {
      "@nba": path.resolve(__dirname, "src"),
      "@nba/design-system": path.resolve(__dirname, "packages/design-system/src"),
    },
  },
})
