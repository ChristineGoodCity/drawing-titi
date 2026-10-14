import { useState } from "react";
import { brushes, type BrushSettings } from "../lib/drawing/brushes";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";

export function DrawingStudio() {
  const [brushId, setBrushId] = useState("paint-marker");
  const [settings, setSettings] = useState<BrushSettings>({
    color: "#000000",
    size: 20,
  });
  const brush = brushes.find((item) => item.id === brushId) ?? brushes[0];

  return (
    <section
      className="overflow-hidden border border-black bg-paper shadow-[0_12px_40px_#00000008]"
      aria-label="Drawing studio"
    >
      <DrawingToolbar
        brushId={brushId}
        settings={settings}
        onBrushChange={setBrushId}
        onSettingsChange={setSettings}
      />
      <DrawingCanvas brush={brush} settings={settings} />
    </section>
  );
}
