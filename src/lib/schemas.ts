export const EVENT_FORMATS = ["offline", "online", "hybrid"] as const;

export type EventFormat = (typeof EVENT_FORMATS)[number];

export type HubEvent = {
  id: string;
  hub: string;
  instagram: string;
  city: string;
  region: string;
  title: string;
  date: string;
  time: string | null;
  format: EventFormat;
  address: string | null;
  zoom_link?: string | null;
  description: string;
  hashtags: string[];
  source_post_url: string;
  parsed_at: string;
};

export type HubStaff = {
  id: string;
  hub: string;
  city: string;
  region: string;
  name: string;
  role: string | null;
  instagram: string | null;
  contact: string | null;
  source: string;
};

export const eventJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Hub events dataset",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: [
      "id",
      "hub",
      "instagram",
      "city",
      "region",
      "title",
      "date",
      "time",
      "format",
      "address",
      "description",
      "hashtags",
      "source_post_url",
      "parsed_at",
    ],
    properties: {
      id: { type: "string", minLength: 1 },
      hub: { type: "string", minLength: 1 },
      instagram: { type: "string", pattern: "^@.+" },
      city: { type: "string", minLength: 1 },
      region: { type: "string", minLength: 1 },
      title: { type: "string", minLength: 1 },
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      time: {
        anyOf: [{ type: "string", pattern: "^\\d{2}:\\d{2}$" }, { type: "null" }],
      },
      format: { enum: EVENT_FORMATS },
      address: { anyOf: [{ type: "string" }, { type: "null" }] },
      zoom_link: { anyOf: [{ type: "string" }, { type: "null" }] },
      description: { type: "string", minLength: 1 },
      hashtags: { type: "array", items: { type: "string" } },
      source_post_url: { type: "string", minLength: 1 },
      parsed_at: { type: "string", format: "date-time" },
    },
  },
} as const;

export const staffJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Hub staff dataset",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: [
      "id",
      "hub",
      "city",
      "region",
      "name",
      "role",
      "instagram",
      "contact",
      "source",
    ],
    properties: {
      id: { type: "string", minLength: 1 },
      hub: { type: "string", minLength: 1 },
      city: { type: "string", minLength: 1 },
      region: { type: "string", minLength: 1 },
      name: { type: "string", minLength: 1 },
      role: { anyOf: [{ type: "string" }, { type: "null" }] },
      instagram: { anyOf: [{ type: "string", pattern: "^@.+" }, { type: "null" }] },
      contact: { anyOf: [{ type: "string" }, { type: "null" }] },
      source: { type: "string", minLength: 1 },
    },
  },
} as const;

export function isHubEvent(value: unknown): value is HubEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<Record<keyof HubEvent, unknown>>;

  return (
    typeof event.id === "string" &&
    typeof event.hub === "string" &&
    typeof event.instagram === "string" &&
    typeof event.city === "string" &&
    typeof event.region === "string" &&
    typeof event.title === "string" &&
    typeof event.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(event.date) &&
    (typeof event.time === "string" || event.time === null) &&
    EVENT_FORMATS.includes(event.format as EventFormat) &&
    (typeof event.address === "string" || event.address === null) &&
    typeof event.description === "string" &&
    Array.isArray(event.hashtags) &&
    typeof event.source_post_url === "string" &&
    typeof event.parsed_at === "string"
  );
}

export function isHubStaff(value: unknown): value is HubStaff {
  if (!value || typeof value !== "object") {
    return false;
  }

  const staff = value as Partial<Record<keyof HubStaff, unknown>>;

  return (
    typeof staff.id === "string" &&
    typeof staff.hub === "string" &&
    typeof staff.city === "string" &&
    typeof staff.region === "string" &&
    typeof staff.name === "string" &&
    (typeof staff.role === "string" || staff.role === null) &&
    (typeof staff.instagram === "string" || staff.instagram === null) &&
    (typeof staff.contact === "string" || staff.contact === null) &&
    typeof staff.source === "string"
  );
}
