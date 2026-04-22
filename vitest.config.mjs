import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic"
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [["tests/components/**/*.test.jsx", "jsdom"]],
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.js", "tests/**/*.test.jsx"]
  },
  resolve: {
    alias: {
      "@": path.resolve(".")
    }
  }
});
