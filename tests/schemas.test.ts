import assert from "node:assert/strict";
import test from "node:test";
import { isHubEvent, isHubStaff, type HubEvent, type HubStaff } from "../src/lib/schemas";

test("isHubEvent accepts a complete event record", () => {
  assert.equal(isHubEvent(validEvent()), true);
});

test("isHubEvent rejects missing or malformed event dates", () => {
  assert.equal(isHubEvent({ ...validEvent(), date: null }), false);
  assert.equal(isHubEvent({ ...validEvent(), date: "10.06.2026" }), false);
});

test("isHubStaff validates nullable contact fields", () => {
  assert.equal(isHubStaff(validStaff()), true);
  assert.equal(isHubStaff({ ...validStaff(), instagram: 42 }), false);
});

function validEvent(): HubEvent {
  return {
    id: "evt_001",
    hub: "Zhambyl Hub",
    instagram: "@zhambyl_hub",
    city: "Тараз",
    region: "zhambyl",
    title: "AI Bootcamp",
    date: "2026-06-10",
    time: null,
    format: "offline",
    address: "Тараз",
    description: "Bootcamp",
    hashtags: [],
    source_post_url: "https://example.com",
    parsed_at: "2026-06-09T10:00:00.000Z",
  };
}

function validStaff(): HubStaff {
  return {
    id: "staff_001",
    hub: "Zhambyl Hub",
    city: "Тараз",
    region: "zhambyl",
    name: "Команда Zhambyl Hub",
    role: "Официальный аккаунт хаба",
    instagram: "@zhambyl_hub",
    contact: null,
    source: "instagram_profile_demo",
  };
}
