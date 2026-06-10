import assert from "node:assert/strict";
import test from "node:test";
import {
  cityToRegion,
  filterUpcomingEvents,
  regionFromText,
} from "../src/lib/filter";
import type { HubEvent } from "../src/lib/schemas";

test("cityToRegion maps supported city aliases", () => {
  assert.equal(cityToRegion("Тараз"), "zhambyl");
  assert.equal(cityToRegion("Алма-Ата"), "almaty");
  assert.equal(cityToRegion("NUR-SULTAN"), "astana");
  assert.equal(cityToRegion("unknown"), null);
});

test("regionFromText finds cities in Russian, Kazakh, and latin text", () => {
  assert.equal(regionFromText("Привет, я из Тараза"), "zhambyl");
  assert.equal(regionFromText("Павлодардағы іс-шаралар қандай?"), "pavlodar");
  assert.equal(regionFromText("Any meetups in Shymkent?"), "shymkent");
  assert.equal(regionFromText("Что есть на этой неделе?"), null);
});

test("filterUpcomingEvents removes past events and sorts by date", () => {
  const events = [
    event({ id: "later", date: "2026-06-12", time: "10:00" }),
    event({ id: "past", date: "2026-06-09", time: "18:00" }),
    event({ id: "today", date: "2026-06-10", time: "09:00" }),
  ];

  assert.deepEqual(
    filterUpcomingEvents(events, "2026-06-10").map((item) => item.id),
    ["today", "later"],
  );
});

function event(overrides: Partial<HubEvent>): HubEvent {
  return {
    id: "evt",
    hub: "Zhambyl Hub",
    instagram: "@zhambyl_hub",
    city: "Тараз",
    region: "zhambyl",
    title: "Event",
    date: "2026-06-10",
    time: null,
    format: "offline",
    address: "Тараз",
    description: "Description",
    hashtags: [],
    source_post_url: "https://example.com",
    parsed_at: "2026-06-09T10:00:00.000Z",
    ...overrides,
  };
}
