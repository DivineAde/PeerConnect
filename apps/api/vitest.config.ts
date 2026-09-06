import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
  },
  resolve: {
    // Workspace packages point their package.json "main" at compiled
    // dist/ output (required so the *production* build's plain `node
    // dist/server.js` can resolve them without a TypeScript loader).
    // Tests, like `tsx` in dev, resolve straight to source instead, so
    // `pnpm test` works on a fresh clone without a prior `pnpm build`.
    alias: {
      "@peerconnect/database": path.resolve(__dirname, "../../packages/database/src/index.ts"),
      "@peerconnect/validation": path.resolve(__dirname, "../../packages/validation/src/index.ts"),
      "@peerconnect/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
    },
  },
});