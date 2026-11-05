import { useRef, useState } from "react";
import type { DrawingCanvasControls } from "./DrawingCanvas";
import { checkDrawing, type ModerationResult } from "../lib/moderation";

const labels = {
  flagged: "Flagged",
  review: "Needs review",
  clear: "No flag detected",
};
const styles = {
  flagged: "bg-red-100 text-red-900",
  review: "bg-amber-100 text-amber-900",
  clear: "bg-green-100 text-green-900",
};

export function DrawingModeration({
  canvasRef,
}: {
  canvasRef: React.RefObject<DrawingCanvasControls | null>;
}) {
  const busy = useRef(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<
    (ModerationResult & { image: string }) | null
  >(null);
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
      const image = snapshot.toDataURL("image/png");
      setResult({ ...(await checkDrawing(image)), image });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not check this drawing. Please retry.",
      );
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  return (
    <aside
      className="absolute bottom-4 right-4 z-20 max-h-[65vh] w-[min(340px,calc(100%-2rem))] overflow-auto border border-black/20 bg-[#f5f5ef]/95 p-4 text-xs shadow-sm"
      aria-label="Drawing moderation test"
    >
      <button
        className="border border-black/40 px-3 py-2 disabled:opacity-50"
        disabled={checking}
        onClick={check}
      >
        {checking ? "Checking…" : "Check drawing"}
      </button>
      <div role="status" aria-live="polite" aria-busy={checking}>
        {checking && <p className="mt-3">Checking words and visual content…</p>}
        {error && <p className="mt-3 text-red-800">{error}</p>}
        {result && (
          <>
            <p
              className={`mt-3 inline-block rounded px-2 py-1 font-semibold ${styles[result.decision]}`}
            >
              {labels[result.decision]}
            </p>
            <img
              src={result.image}
              alt="Exact drawing snapshot checked"
              className="mt-3 max-h-32 w-full border border-black/10 object-contain"
            />
            <p className="mt-3 whitespace-pre-wrap break-words">
              {result.reason}
            </p>
            {/* {result.nudeBodyDrawing !== undefined && (
              <p className="mt-2">
                Exposed breasts / buttocks:{" "}
                {result.nudeBodyDrawing ? "Detected" : "Not detected"}
              </p>
            )}
            {result.genitalDrawing !== undefined && (
              <p className="mt-2">
                Genital drawing:{" "}
                {result.genitalDrawing ? "Detected" : "Not detected"}
              </p>
            )} */}
            {!!result.offensiveWords?.length && (
              <p className="mt-2 break-words">
                Flagged words: {result.offensiveWords.join(", ")}
              </p>
            )}
            {result.detectedText !== undefined && (
              <>
                <h3 className="mt-3 font-semibold">Recognized text</h3>
                <p className="mt-1 whitespace-pre-wrap break-words border border-black/10 bg-white p-2">
                  {result.detectedText || "No readable text detected."}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
