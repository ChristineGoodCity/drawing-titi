import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { geminiModeration } from "./server/moderationPlugin.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "GEMINI_");
  return {
    base: "/drawing-titi/",
    plugins: [
      react(),
      tailwindcss(),
      geminiModeration(env.GEMINI_API_KEY || ""),
    ],
    build: {
      rollupOptions: {
        input: {
          main: "index.html",
          gallery: "gallery/index.html",
        },
      },
    },
  };
});
