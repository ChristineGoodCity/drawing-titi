import type { Plugin } from "vite";
import { moderationHandler } from "./gemini.ts";

// Local development/preview only; static builds do not include a backend.
export function geminiModeration(apiKey: string): Plugin {
  const handler = moderationHandler(apiKey);
  let endpoint: string;
  return {
    name: "gemini-moderation",
    configResolved(config) {
      endpoint = `${config.base}api/moderate`;
    },
    configureServer(server) {
      server.middlewares.use(endpoint, handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(endpoint, handler);
    },
  };
}
