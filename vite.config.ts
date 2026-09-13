import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "/",
  plugins: [react(), svgr()],
  // Pre-bundle React and the reactive store's React bindings up front. Otherwise the first cold dev load discovers
  // @kuindji/reactive/react late, re-optimizes mid-load and mixes two React copies ("Invalid hook call").
  optimizeDeps: { include: ["react", "react-dom", "react/jsx-runtime", "@kuindji/reactive/react"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // The whole data set is bundled into the one site chunk (no backend), so it passes Vite's 500 kB default once the
  // case board and marked are in. 700 kB keeps the warning meaningful for real growth.
  build: { outDir: "dist", rollupOptions: { input: "index.html" }, chunkSizeWarningLimit: 700 },
});
