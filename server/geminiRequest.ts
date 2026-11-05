const RETRYABLE = new Set([500, 502, 503, 504]);

// One retry, inside the frontend's 50s and Vercel's 60s deadlines.
export async function requestGemini(
  url: string,
  init: RequestInit,
  request = fetch,
  wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
) {
  const started = Date.now();
  const signal = AbortSignal.timeout(43_000);
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await request(url, { ...init, signal });
    if (!response.ok) {
      // Never log credentials, images, prompts, or arbitrary provider error text.
      const data = (await response
        .clone()
        .json()
        .catch(() => null)) as { error?: { status?: unknown } } | null;
      const status = data?.error?.status;
      console.warn(
        "[moderation]",
        JSON.stringify({
          attempt,
          httpStatus: response.status,
          elapsedMs: Date.now() - started,
          providerStatus:
            typeof status === "string" && /^[A-Z_]{1,64}$/.test(status)
              ? status
              : "UNKNOWN",
        }),
      );
    }
    if (
      attempt === 2 ||
      !RETRYABLE.has(response.status) ||
      Date.now() - started > 35_000
    )
      return response;
    await response.body?.cancel();
    await wait(1_000);
    signal.throwIfAborted();
  }
  throw new Error("Unreachable");
}
