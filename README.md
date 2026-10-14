# Drawing Titi

A small React + TypeScript drawing component using native Canvas 2D and Pointer Events. No drawing library.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and builds for production. `npm run lint` runs the linter.

## Add a brush

Add a `Brush` to `src/lib/drawing/brushes.ts`. Each brush supplies an ID, a name, and a `stamp` function that draws at a point using the selected color and size. The toolbar discovers registered brushes automatically. The engine interpolates stamps between pointer positions. For image brushes, preload a transparent image and call `ctx.drawImage` in the stamp function.

`src/components/DrawingCanvas.tsx` handles pointer capture and coordinate mapping. `src/lib/drawing/engine.ts` handles stroke interpolation, independently of React. Brush settings are frozen for each stroke.

This starter includes pen, paint marker, and grain brushes, size and color controls, and clear. Artwork is in memory only. Undo, export, advanced smoothing, and image brush loading are future additions. The drawing surface uses a fixed 1200 × 400 backing canvas so layout changes preserve artwork.

## Structure

- `src/components/`: drawing studio, toolbar, and canvas components.
- `src/lib/drawing/`: framework-independent brush definitions and stroke engine.
- `src/styles/globals.css`: Tailwind CSS 4 import, theme tokens, and base styles.
- `src/App.tsx`: application composition.

Tailwind uses the official Vite plugin. Component styling uses utility classes; shared colors and fonts live in the CSS theme.
