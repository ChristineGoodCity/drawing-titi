import { test } from "node:test";
import assert from "node:assert/strict";
import { requestGemini } from "./geminiRequest.ts";

test("retries transient errors once and keeps one shared deadline", async () => {
  let calls = 0;
  const signals: unknown[] = [];
  const result = await requestGemini(
    "https://example.test",
    {},
    async (_url, init) => {
      signals.push(init?.signal);
      return ++calls === 1
        ? Response.json({ error: { status: "UNAVAILABLE" } }, { status: 503 })
        : Response.json({ ok: true });
    },
    async () => {},
  );
  assert.equal(result.status, 200);
  assert.equal(calls, 2);
  assert.equal(signals[0], signals[1]);
});
test("does not retry quota or authentication failures and caps transient attempts", async () => {
  for (const status of [400, 401, 403, 429, 503]) {
    let calls = 0;
    const response = await requestGemini(
      "https://example.test",
      {},
      async () => {
        calls++;
        return new Response("", { status });
      },
      async () => {},
    );
    assert.equal(response.status, status);
    assert.equal(calls, status === 503 ? 2 : 1);
  }
});
