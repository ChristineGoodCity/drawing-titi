import { useRef, useState } from "react";
import { brushes, type BrushSettings } from "../lib/drawing/brushes";
import { DrawingCanvas, type DrawingCanvasControls } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
import { DrawingModeration } from "./DrawingModeration";

export function DrawingStudio() {
  const canvasRef = useRef<DrawingCanvasControls>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [brushId, setBrushId] = useState(brushes[0].id);
  const [settings, setSettings] = useState<BrushSettings>({
    color: "#000000",
    size: brushes[0].defaultSize ?? 20,
  });
  const brush = brushes.find((item) => item.id === brushId) ?? brushes[0];

  return (
    <section
      className="relative h-full w-full overflow-hidden bg-background"
      aria-label="Drawing studio"
    >
      <img
        src={`${import.meta.env.BASE_URL}playground/Frame%2013.svg`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[55%] -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.03]"
      />
      <DrawingToolbar
        onClear={() => canvasRef.current?.clear()}
        onUndo={() => canvasRef.current?.undo()}
        canUndo={canUndo}
        brushId={brushId}
        settings={settings}
        onBrushChange={(id) => {
          setBrushId(id);
          const defaultSize = brushes.find(
            (item) => item.id === id,
          )?.defaultSize;
          if (defaultSize !== undefined) {
            setSettings((current) => ({ ...current, size: defaultSize }));
          }
        }}
        onSettingsChange={setSettings}
      />
      <DrawingCanvas
        ref={canvasRef}
        brush={brush}
        settings={settings}
        onHistoryChange={setCanUndo}
      />
      <DrawingModeration canvasRef={canvasRef} />
    </section>
  );
}
