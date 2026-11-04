import { useRef, useState } from "react";
import type { DrawingCanvasControls } from "./DrawingCanvas";

import { predictDrawing, type Prediction } from "../lib/drawingModel";

const BLOCK_THRESHOLD = 0.85;
const PASS_THRESHOLD = 0.9;
const decisionStyles = {
  Pass: "bg-green-100 text-green-900",
  Blocked: "bg-red-100 text-red-900",
  "Needs review": "bg-amber-100 text-amber-900",
};

export function DrawingModelCheck({
  canvasRef,
}: {
  canvasRef: React.RefObject<DrawingCanvasControls | null>;
}) {
  const busy = useRef(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    image: string;
    predictions: Prediction[];
  } | null>(null);
  const allowedScore = result?.predictions.find(
    (p) => p.className === "Allowed drawings",
  )?.probability;
  const inappropriateScore = result?.predictions.find(
    (p) => p.className === "Inappropriate drawings",
  )?.probability;
  const decision =
    inappropriateScore !== undefined && inappropriateScore >= BLOCK_THRESHOLD
      ? "Blocked"
      : allowedScore !== undefined &&
          inappropriateScore !== undefined &&
          allowedScore >= PASS_THRESHOLD
        ? "Pass"
        : "Needs review";
  async function check() {
    if (busy.current) return;
    setError("");
    setResult(null);
    const snapshot = canvasRef.current?.snapshot();
    if (!snapshot) {
      setError("Draw something first.");
      return;
    }
    busy.current = true;
    setChecking(true);
    try {
      const predictions = await predictDrawing(snapshot);
      if (
        !predictions.length ||
        predictions.some(
          (p) =>
            !Number.isFinite(p.probability) ||
            p.probability < 0 ||
            p.probability > 1,
        )
      )
        throw new Error("Invalid prediction");
      setResult({ image: snapshot.toDataURL(), predictions });
    } catch {
      setError("Could not load or run your model. Please try again.");
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  return (
    <aside
      className="absolute bottom-4 right-4 z-20 max-h-[60vh] w-[min(320px,calc(100%-2rem))] overflow-auto border border-black/20 bg-[#f5f5ef]/95 p-4 text-xs shadow-sm"
      aria-label="Drawing model check"
    >
      <div className="flex items-center justify-between gap-3">
        <span>Your drawing model</span>
        <button
          className="border border-black/40 px-3 py-2 disabled:opacity-50"
          disabled={checking}
          onClick={check}
        >
          {checking ? "Checking…" : "Check drawing"}
        </button>
      </div>
      <div role="status" aria-live="polite" aria-busy={checking}>
        {checking && <p className="mt-3">Loading your model and checking…</p>}
        {error && <p className="mt-3">{error}</p>}
        {result && (
          <>
            <p
              className={`mt-3 inline-block rounded px-2 py-1 font-semibold ${decisionStyles[decision]}`}
            >
              {decision}
            </p>
            <img
              src={result.image}
              alt="Exact drawing snapshot checked by the model"
              className="mx-auto mt-3 h-28 w-28 border border-black/10"
            />
            <ul className="mt-3 space-y-2">
              {result.predictions.map((p) => (
                <li key={p.className} className="flex justify-between gap-3">
                  <span>{p.className}</span>
                  <span>{(p.probability * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-relaxed">
              Pass: allowed score ≥ {PASS_THRESHOLD * 100}%. <br /> Blocked: inappropriate score ≥ {BLOCK_THRESHOLD * 100}%. Otherwise: needs review.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
