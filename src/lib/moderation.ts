export type ModerationResult = {
  decision: "flagged" | "review" | "clear";
  reason: string;
  model: string;
  detectedText?: string;
  offensiveWords?: string[];
  genitalDrawing?: boolean;
  nudeBodyDrawing?: boolean;
};

export async function checkDrawing(image: string): Promise<ModerationResult> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
    signal: AbortSignal.timeout(50_000),
  });
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(
      "The moderation endpoint is missing or unavailable. Deploy the api/moderate function with the website, then try again.",
    );
  }
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "The drawing could not be checked.");
  if (
    !["flagged", "review", "clear"].includes(result.decision) ||
    typeof result.reason !== "string"
  ) {
    throw new Error(
      "Invalid moderation response. The drawing has not been checked.",
    );
  }
  return result;
}
