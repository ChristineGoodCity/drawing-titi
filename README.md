# Drawing Titi

A small React + TypeScript drawing component using native Canvas 2D and Pointer Events. No drawing library.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and builds for production. `npm run lint` runs the linter.

## Try your Teachable Machine model

Click **Check drawing** to run the exported model locally in your browser. The result panel shows both trained classes and the exact snapshot checked; it does not save, publish, or approve submissions. Empty canvases are rejected before prediction. The entire drawing is fitted into a white 224 × 224 square to avoid cropping off edge content. Use similarly prepared images when training and evaluating.

Replace `public/my_model/model.json`, `metadata.json`, and `weights.bin` together to update the model, then reload the app. The model loads on the first check. TensorFlow.js 1.3.1 is pinned to the Teachable Machine package's peer dependency; its bundled TypeScript enums require `erasableSyntaxOnly: false`. Browser predictions are for experimentation, not enforceable publication controls.

## Add a brush

Add a `Brush` to `src/lib/drawing/brushes.ts`. Each brush supplies an ID, a name, and a `stamp` function that draws at a point using the selected color and size. The toolbar discovers registered brushes automatically. The engine interpolates stamps between pointer positions. For image brushes, preload a transparent image and call `ctx.drawImage` in the stamp function.

`src/components/DrawingCanvas.tsx` handles pointer capture and coordinate mapping. `src/lib/drawing/engine.ts` handles stroke interpolation, independently of React. Brush settings are frozen for each stroke.

The app includes pen, paint marker, Posca, and spray brushes, size and color controls, undo, and clear. Artwork stays in memory. The canvas follows the displayed size and uses device pixel density (up to 4×) for its backing bitmap. Resizing preserves artwork.

The model check uses a 90% allowed threshold for **Pass** and an 85% inappropriate threshold for **Blocked**; other results need review. These thresholds and their displayed values share constants in `src/components/DrawingModelCheck.tsx`. Model loading is isolated in `src/lib/drawingModel.ts`.

## Structure

- `src/components/`: drawing studio, toolbar, and canvas components.
- `src/lib/drawing/`: framework-independent brush definitions and stroke engine.
- `src/styles/globals.css`: Tailwind CSS 4 import, theme tokens, and base styles.
- `src/App.tsx`: application composition.

Tailwind uses the official Vite plugin. Component styling uses utility classes; shared colors and fonts live in the CSS theme.

Image brushes share `src/lib/drawing/imageTip.ts` for image decoding and tinted texture caching. Brush interfaces live in `src/lib/drawing/types.ts`; the registry assembles the available brushes. Holding down deposits paint; release, cancellation, changing brushes, window blur, and hiding the tab stop the flow.
