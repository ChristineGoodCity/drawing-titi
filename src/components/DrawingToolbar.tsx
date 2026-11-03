import { brushes, type BrushSettings } from "../lib/drawing/brushes";

type Props = {
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  brushId: string;
  settings: BrushSettings;
  onBrushChange: (id: string) => void;
  onSettingsChange: (settings: BrushSettings) => void;
};

export function DrawingToolbar({
  onClear,
  onUndo,
  canUndo,
  brushId,
  settings,
  onBrushChange,
  onSettingsChange,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 px-5 py-3 max-[540px]:gap-3.5 max-[540px]:p-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <div className="flex flex-wrap gap-1.5" aria-label="Brushes">
          {brushes.map((brush) => (
            <button
              key={brush.id}
              className="pointer-events-auto min-h-10 border border-[#34343040] bg-[#e6e6e0]/65 whitespace-nowrap px-3.5 py-2.5 text-[9px] leading-normal max-[680px]:px-2.5 text-[#30302b] backdrop-blur-[14px] hover:bg-[#f0f0ea]/80 aria-pressed:border-[#30302b] aria-pressed:bg-[#f5f5ef]/82 aria-pressed:text-[#171714]"
              aria-pressed={brushId === brush.id}
              onClick={() => onBrushChange(brush.id)}
            >
              {brush.name}
            </button>
          ))}
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-4" role="group" aria-label="Canvas controls">
          <label className="flex min-w-0 items-center gap-2.5 text-[9px] leading-normal">
            Color
            <input
              type="color"
              className="pointer-events-auto h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
              value={settings.color}
              onChange={(event) =>
                onSettingsChange({ ...settings, color: event.target.value })
              }
            />
          </label>
          <label className="flex min-w-0 items-center gap-2.5 text-[9px] leading-normal">
            Size
            <input
              type="range"
              className="pointer-events-auto w-25 min-w-0 accent-accent"
              min="2"
              max="80"
              value={settings.size}
              onChange={(event) =>
                onSettingsChange({ ...settings, size: Number(event.target.value) })
              }
            />
            <output className="w-5 tabular-nums">{settings.size}</output>
          </label>
          <button
            className="pointer-events-auto py-3 text-[9px] leading-normal underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-35"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo the last stroke or clear"
          >
            Revert
          </button>
          <button className="pointer-events-auto py-3 text-[9px] leading-normal underline underline-offset-4" onClick={onClear}>
            Clear canvas
          </button>
        </div>
      </div>
      <a className="pointer-events-auto py-3 text-[9px] leading-normal underline underline-offset-4" href={`${import.meta.env.BASE_URL}gallery/`}>
        Gallery
      </a>
    </div>
  );
}
