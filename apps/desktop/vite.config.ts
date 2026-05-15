import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

export default defineConfig({
  plugins: [react()],
  publicDir,
  server: {
    port: 5174,
    strictPort: false
  },
  clearScreen: false
});
