import { useRef, useState } from "react";
import { brushes, type BrushSettings } from "../lib/drawing/brushes";
import { DrawingCanvas, type DrawingCanvasControls } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";

export function DrawingStudio() {
  const canvasRef = useRef<DrawingCanvasControls>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [brushId, setBrushId] = useState(brushes[0].id);
  const [settings, setSettings] = useState<BrushSettings>({
    color: "#000000",
    size: 20,
  });
  const brush = brushes.find((item) => item.id === brushId) ?? brushes[0];

  return (
    <section
      className="relative h-full w-full overflow-hidden bg-background"
      aria-label="Drawing studio"
    >
      <DrawingToolbar
        onClear={() => canvasRef.current?.clear()}
        onUndo={() => canvasRef.current?.undo()}
        canUndo={canUndo}
        brushId={brushId}
        settings={settings}
        onBrushChange={setBrushId}
        onSettingsChange={setSettings}
      />
      <DrawingCanvas ref={canvasRef} brush={brush} settings={settings} onHistoryChange={setCanUndo} />
    </section>
  );
}
