import { brushes, type BrushSettings } from "../lib/drawing/brushes";

type Props = {
  brushId: string;
  settings: BrushSettings;
  onBrushChange: (id: string) => void;
  onSettingsChange: (settings: BrushSettings) => void;
};

export function DrawingToolbar({
  brushId,
  settings,
  onBrushChange,
  onSettingsChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-6 border-b border-black px-5 py-4 max-[540px]:gap-3.5 max-[540px]:p-3">
      <div className="mr-auto flex flex-wrap gap-1.5" aria-label="Brushes">
        {brushes.map((brush) => (
          <button
            key={brush.id}
            className="rounded-[7px] px-3.5 py-2 text-[13px] hover:bg-hover aria-pressed:bg-selected aria-pressed:text-selected-ink"
            aria-pressed={brushId === brush.id}
            onClick={() => onBrushChange(brush.id)}
          >
            {brush.name}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2.5 text-xs">
        Color
        <input
          type="color"
          className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
          value={settings.color}
          onChange={(event) =>
            onSettingsChange({ ...settings, color: event.target.value })
          }
        />
      </label>
      <label className="flex items-center gap-2.5 text-xs">
        Size
        <input
          type="range"
          className="w-25 accent-accent"
          min="2"
          max="80"
          value={settings.size}
          onChange={(event) =>
            onSettingsChange({ ...settings, size: Number(event.target.value) })
          }
        />
        <output className="w-5 tabular-nums">{settings.size}</output>
      </label>
    </div>
  );
}
