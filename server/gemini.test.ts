import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { moderationHandler, parseResult } from "./gemini.ts";

const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4WQAAAAASUVORK5CYII=";
const clear = {
  genitalDrawing: false,
  nudeBodyDrawing: false,
  offensiveWords: [],
  detectedText: "",
  uncertain: false,
  reason: "A flower.",
};
async function invoke(
  key: string,
  upstream: typeof fetch,
  body: unknown = { image },
  parsed = false,
) {
  const req = Readable.from([JSON.stringify(body)]) as IncomingMessage;
  if (parsed) Object.assign(req, { body });
  req.method = "POST";
  req.headers = {
    "content-type": "application/json",
    host: "localhost:5173",
    origin: "http://localhost:5173",
  };
  let status = 0;
  let data: Record<string, unknown> = {};
  const res = {
    writeHead(code: number) {
      status = code;
    },
    end(text: string) {
      data = JSON.parse(text);
    },
  } as unknown as ServerResponse;
  await moderationHandler(key, upstream)(req, res);
  return { status, data };
}
const unused: typeof fetch = async () => {
  throw new Error("Must not call upstream");
};

test("missing credentials and malformed image fail closed", async () => {
  assert.equal((await invoke("", unused)).status, 503);
  assert.equal((await invoke("secret", unused, { image: "bad" })).status, 400);
});
test("flags are computed from findings, with ambiguity requiring review", () => {
  assert.equal(parseResult(clear).decision, "clear");
  assert.equal(
    parseResult({ ...clear, genitalDrawing: true }).decision,
    "flagged",
  );
  assert.equal(
    parseResult({ ...clear, offensiveWords: ["fuck"] }).decision,
    "flagged",
  );
  assert.equal(parseResult({ ...clear, uncertain: true }).decision, "review");
  assert.throws(() => parseResult({ ...clear, genitalDrawing: "false" }));
});
test("sends server credential and image, returns validated result", async () => {
  const upstream: typeof fetch = async (url, options) => {
    assert.match(String(url), /gemini-3\.5-flash-lite:generateContent$/);
    assert.equal(
      (options?.headers as Record<string, string>)["x-goog-api-key"],
      "secret",
    );
    const sent = JSON.parse(String(options?.body));
    assert.equal(
      sent.contents[0].parts[1].inlineData.data,
      image.split(",")[1],
    );
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(clear) }] },
        },
      ],
    });
  };
  const result = await invoke("secret", upstream);
  assert.equal(result.status, 200);
  assert.equal(result.data.decision, "clear");
  assert.ok(!JSON.stringify(result).includes("secret"));
});
test("quota, safety block, malformed response and network failure never clear", async () => {
  const quota = await invoke(
    "secret",
    async () => new Response("", { status: 429 }),
  );
  assert.equal(quota.status, 429);
  assert.equal(quota.data.decision, undefined);
  const blocked = await invoke("secret", async () =>
    Response.json({ promptFeedback: { blockReason: "SAFETY" } }),
  );
  assert.equal(blocked.data.decision, "review");
  const malformed = await invoke("secret", async () =>
    Response.json({
      candidates: [
        { finishReason: "STOP", content: { parts: [{ text: "{}" }] } },
      ],
    }),
  );
  assert.equal(malformed.status, 502);
  assert.equal((await invoke("secret", unused)).status, 502);
});

test("project list overrides a model that allows SUCK without contradicting the reason", () => {
  const result = parseResult({
    ...clear,
    detectedText: "SUCK",
    reason: "Not inherently offensive.",
  });
  assert.equal(result.decision, "flagged");
  assert.ok(result.offensiveWords.includes("suck"));
  assert.match(result.reason, /project word list/);
  assert.ok(!result.reason.includes("Not inherently"));
});
test("word policy handles case, punctuation, Unicode and phrases without substring flags", () => {
  for (const text of [
    "ＦＵＣＫ",
    "You are an ASSHOLE!",
    "kill yourself",
    "suck\u200b",
  ]) {
    assert.equal(
      parseResult({ ...clear, detectedText: text }).decision,
      "flagged",
      text,
    );
  }
  for (const text of [
    "class assignment",
    "Scunthorpe",
    "cocktail",
    "shell",
    "grass",
    "shoes",
  ]) {
    assert.equal(
      parseResult({ ...clear, detectedText: text }).decision,
      "clear",
      text,
    );
  }
  const result = parseResult({
    ...clear,
    detectedText: "SUCK",
    offensiveWords: ["suck", "other insult"],
  });
  assert.deepEqual(result.offensiveWords, ["suck", "other insult"]);
});

test("body drawing findings flag independently of genitals; ambiguity requires review", () => {
  assert.equal(
    parseResult({ ...clear, nudeBodyDrawing: true }).decision,
    "flagged",
  );
  assert.equal(
    parseResult({
      ...clear,
      uncertain: true,
      reason: "Could be breasts or an abstract shape.",
    }).decision,
    "review",
  );
  assert.throws(() => parseResult({ ...clear, nudeBodyDrawing: "false" }));
  assert.throws(() => parseResult({ ...clear, nudeBodyDrawing: undefined }));
});

test("upstream failures identify the cause without exposing provider data", async () => {
  for (const [status, expected] of [
    [503, /overloaded/],
    [404, /not found/],
    [500, /internal server error/],
  ] as const) {
    const result = await invoke("secret", async () =>
      Response.json({ error: { message: "secret" } }, { status }),
    );
    assert.equal(result.status, 502);
    assert.match(String(result.data.error), expected);
    assert.match(String(result.data.error), new RegExp(`HTTP ${status}`));
    assert.ok(!JSON.stringify(result).includes("secret"));
    assert.equal(result.data.decision, undefined);
  }
});

test("Vercel parsed request bodies reach Gemini and retain input validation", async () => {
  const upstream: typeof fetch = async () =>
    Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(clear) }] },
        },
      ],
    });
  assert.equal(
    (await invoke("secret", upstream, { image }, true)).data.decision,
    "clear",
  );
  assert.equal(
    (await invoke("secret", unused, { image: "bad" }, true)).status,
    400,
  );
  assert.equal(
    (await invoke("secret", unused, { image: "x".repeat(4_000_001) }, true))
      .status,
    413,
  );
});
