import assert from "node:assert/strict";
import test from "node:test";
import { readEvents, readStaff, writeData } from "../src/lib/dataStore";
import { isHubEvent, isHubStaff } from "../src/lib/schemas";

test("readEvents/readStaff fall back to bundled seed when KV is not configured", async () => {
  const restoreKv = clearKvEnv();

  try {
    const events = await readEvents();
    const staff = await readStaff();

    assert.ok(events.length > 0, "expected seed events");
    assert.ok(events.every(isHubEvent), "every seed event is valid");
    assert.ok(staff.length > 0, "expected seed staff");
    assert.ok(staff.every(isHubStaff), "every seed staff record is valid");
  } finally {
    restoreKv();
  }
});

test("writeData refuses to persist on Vercel without a KV store", async () => {
  const restoreKv = clearKvEnv();
  const previousVercel = process.env.VERCEL;
  process.env.VERCEL = "1";

  try {
    await assert.rejects(() => writeData([], []), /durable store/i);
  } finally {
    if (previousVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = previousVercel;
    }
    restoreKv();
  }
});

function clearKvEnv() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  return () => {
    restoreEnv("KV_REST_API_URL", url);
    restoreEnv("KV_REST_API_TOKEN", token);
  };
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
