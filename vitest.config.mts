import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    env: {
      ROOT_DOMAIN: "localhost",
      APP_PROTOCOL: "http",
      APP_PORT: "3000",
      LARAVEL_INTERNAL_URL: "http://127.0.0.1:8000",
      INTERNAL_API_KEY: "test-internal-key",
      SESSION_SECRET: "test-session-secret-at-least-32-chars",
    },
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
  },
});
