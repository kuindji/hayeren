import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vite.config";

export default mergeConfig(
  base,
  defineConfig({
    test: { globals: true, environment: "jsdom", setupFiles: ["tests/setup.ts"], include: ["tests/**/*.test.{ts,tsx}"] },
  }),
);
