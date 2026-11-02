import { useState } from "react";
import { brushes, type BrushSettings } from "../lib/drawing/brushes";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";

export function DrawingStudio() {
  const [clearVersion, setClearVersion] = useState(0);
  const [brushId, setBrushId] = useState("organic-drip");
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
        onClear={() => setClearVersion((version) => version + 1)}
        brushId={brushId}
        settings={settings}
        onBrushChange={setBrushId}
        onSettingsChange={setSettings}
      />
      <DrawingCanvas brush={brush} settings={settings} clearVersion={clearVersion} />
    </section>
  );
}
