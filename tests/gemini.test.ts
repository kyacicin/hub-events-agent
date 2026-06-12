import assert from "node:assert/strict";
import test from "node:test";
import { geminiModelCandidates } from "../src/lib/gemini";

test("geminiModelCandidates includes default fallbacks without duplicates", () => {
  assert.deepEqual(geminiModelCandidates("gemini-3.5-flash"), [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ]);
});

test("geminiModelCandidates supports explicit fallback model list", () => {
  assert.deepEqual(
    geminiModelCandidates("gemini-3.5-flash", "gemini-2.5-flash, gemini-3.5-flash"),
    ["gemini-3.5-flash", "gemini-2.5-flash"],
  );
});
