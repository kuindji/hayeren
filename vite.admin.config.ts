import { defineConfig, mergeConfig } from "vite";
import base from "./vite.config.ts";
import { adminApiPlugin } from "./src/admin/server/plugin.ts";

export default mergeConfig(
  base,
  defineConfig({
    plugins: [adminApiPlugin()],
    server: { port: 5174, open: "/admin.html" },
    build: { rollupOptions: { input: "admin.html" } },
  }),
);
