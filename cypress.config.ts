import { defineConfig } from "cypress";

export default defineConfig({
  // Node's resolver (used by the Cypress proxy) does not map *.localhost to loopback on every OS.
  hosts: { "*.localhost": "127.0.0.1" },
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: false,
    video: false,
  },
});
