import { defineConfig, mergeConfig } from "vite";
import base from "./vite.config";

export default mergeConfig(
  base,
  defineConfig({
    server: { port: 5174, open: "/admin.html" },
    build: { rollupOptions: { input: "admin.html" } },
  }),
);
