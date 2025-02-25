import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      entryRoot: "src",
      outDir: "dist",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "inquirer",
        "node:child_process",
        "node:fs",
        "node:path", 
        "node:url",
        "path",
        "fs",
        "url",
        "child_process",
        "fsevents",
        "vite"
      ],
    },
  },
});