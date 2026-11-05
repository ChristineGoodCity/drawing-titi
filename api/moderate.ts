import { moderationHandler } from "../server/gemini.ts";

// Vercel supplies this secret at runtime; it never enters the browser bundle.
export default moderationHandler(process.env.GEMINI_API_KEY?.trim() || "");
