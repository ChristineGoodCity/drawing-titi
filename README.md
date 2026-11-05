# Drawing Titi

A React + TypeScript drawing studio and gallery using native Canvas 2D and Pointer Events.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and builds both pages. `npm run lint` runs the linter. `npm test` runs mocked moderation tests without API calls.

## Try Gemini moderation

Moderation uses `gemini-3.5-flash-lite` to check handwritten words and drawings against the project policies.

1. Create an API key for your Gemini project in Google AI Studio.
2. Add `GEMINI_API_KEY=your-key` to `.env.local` (ignored by Git). Never use a `VITE_` prefix for the key.
3. Run `npm install` and restart `npm run dev`.
4. Draw something and click **Check drawing**. The PNG snapshot is capped at 1,024 pixels on its longest side, preserving aspect ratio without cropping or upscaling. This reduced snapshot is sent to Google; the panel shows the decision, reason, recognized text and flagged words.

The key stays in Vite's server process. A local `/api/moderate` endpoint sends the request to Gemini with structured JSON output. Missing keys, quota failures, timeouts and invalid responses are errors, never approvals; incomplete or safety-filtered responses require manual review. One request runs at a time, with a 6 MB body limit and a 45-second upstream timeout. No automatic retries consume extra quota.

This endpoint is available in `npm run dev` and `npm run preview` only. A production deployment needs a server endpoint (such as a Vercel Function) with authentication and rate limiting before enabling public moderation. This panel does not publish or enforce submissions. Review false positives and missed examples before relying on it. Google handles submitted images under your account's applicable API terms. Quotas are project/model-specific; check AI Studio for current limits.

Live accuracy testing requires your Gemini key.

## Add a brush

Add a `Brush` to `src/lib/drawing/brushes.ts`. Each brush supplies an ID, a name, and a `stamp` function that draws at a point using the selected color and size. The toolbar discovers registered brushes automatically. The engine interpolates stamps between pointer positions. For image brushes, preload a transparent image and call `ctx.drawImage` in the stamp function.

`src/components/DrawingCanvas.tsx` handles pointer capture and coordinate mapping. `src/lib/drawing/engine.ts` handles stroke interpolation, independently of React. Brush settings are frozen for each stroke.

The app includes pen, paint marker, Posca, and spray brushes, size and color controls, undo, and clear. Artwork stays in memory. The canvas follows the displayed size and uses device pixel density (up to 4×) for its backing bitmap. Resizing preserves artwork.

## Structure

- `src/components/`: drawing studio, toolbar, canvas, moderation panel and gallery helpers.
- `src/lib/moderation.ts`: browser client for the moderation endpoint.
- `server/gemini.ts`: Gemini requests and result validation.
- `server/moderationPlugin.ts`: local Vite endpoint registration.
- `server/moderationWords.ts` and `server/visualPolicy.ts`: editable moderation rules.
- `src/lib/drawing/`: framework-independent brush definitions and stroke engine.
- `src/styles/globals.css`: Tailwind CSS 4 import, theme tokens, and base styles.
- `src/App.tsx`: drawing page composition.
- `src/gallery-main.tsx` and `src/Gallery.tsx`: gallery entry point and view selection.

Tailwind uses the official Vite plugin. Component styling uses utility classes; shared colors and fonts live in the CSS theme.

Image brushes share `src/lib/drawing/imageTip.ts` for image decoding and tinted texture caching. Brush interfaces live in `src/lib/drawing/types.ts`; the registry assembles the available brushes. Holding down deposits paint; release, cancellation, changing brushes, window blur, and hiding the tab stop the flow.

## Custom word policy

Edit `server/moderationWords.ts` to change the English banned-word/phrase list. This is our strict project policy, not Google's internal vocabulary. It includes “suck” and other words with potentially innocent uses. Gemini receives the list plus instructions to recognize other profanity, slurs and abusive language. The server independently matches recognized text against the list and forces a flag, even when Gemini considers the word harmless. Matching ignores case, punctuation and Unicode width, uses whole words/phrases, and does not flag “class” for containing “ass”. Obfuscated handwriting and other languages still rely on Gemini's interpretation; this is not a complete list of all offensive words. Recheck the drawing after changing policy; old results are not recomputed.

## Custom drawing policy

Edit `server/visualPolicy.ts` for visual rules. Recognizable genitals, exposed breasts with nipples and bare buttocks (including simple or rotated doodles) are flagged. Plausible but ambiguous anatomical drawings require review; ordinary abstract shapes without anatomical cues should not automatically be flagged. The server validates separate genital and nude-body findings. Prompt changes do not guarantee recognition; recheck real examples to evaluate the model.
