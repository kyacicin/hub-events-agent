import assert from "node:assert/strict";
import test from "node:test";
import {
  processInstagramPosts,
  type ApifyInstagramPost,
  type ExtractedPost,
  type InstagramPostExtractor,
} from "../src/lib/scraper";

test("processInstagramPosts reuses scraper rules for events, staff, and dedupe", async () => {
  const posts: ApifyInstagramPost[] = [
    post("valid", "zhambyl_hub"),
    post("duplicate", "zhambyl_hub", "valid"),
    post("missing-date", "zhambyl_hub"),
    post("unknown", "not_a_hub"),
  ];
  const extractor: InstagramPostExtractor = async (rawPost) =>
    extractionByCode(rawPost.shortCode ?? "");

  const result = await processInstagramPosts(posts, {
    now: new Date("2026-06-10T00:00:00+05:00"),
    extractor,
  });

  assert.equal(result.rawPostsCount, 4);
  assert.equal(result.written, false);
  assert.deepEqual(
    result.events.map((event) => event.id),
    ["evt_zhambyl_valid"],
  );
  assert.equal(result.events[0]?.date, "2026-06-11");
  assert.equal(result.staff.length, 1);
  assert.equal(result.staff[0]?.instagram, "@zhambyl_hub");
});

function post(
  id: string,
  ownerUsername: string,
  shortCode: string = id,
): ApifyInstagramPost {
  return {
    id,
    shortCode,
    ownerUsername,
    caption: `Caption ${id}`,
    url: `https://www.instagram.com/p/${shortCode}/`,
    takenAtIso: "2026-06-09T10:00:00.000Z",
    hashtags: ["AstanaHub"],
  };
}

function extractionByCode(shortCode: string): ExtractedPost {
  if (shortCode === "missing-date") {
    return {
      is_event: true,
      event: {
        title: "No date event",
        date: null,
        time: null,
        format: "offline",
        address: "Тараз",
        zoom_link: null,
        description: "Should be skipped.",
      },
      staff: [],
    };
  }

  return {
    is_event: true,
    event: {
      title: "AI Bootcamp",
      date: "2026-06-11",
      time: "10:00",
      format: "offline",
      address: "Тараз",
      zoom_link: null,
      description: "Bootcamp.",
    },
    staff: [
      {
        name: "Команда Zhambyl Hub",
        role: "Официальный аккаунт хаба",
        instagram: "zhambyl_hub",
        contact: null,
      },
    ],
  };
}
