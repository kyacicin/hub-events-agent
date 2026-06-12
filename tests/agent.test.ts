import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSystemPrompt,
  isStaffQuestion,
  staffAgentReply,
} from "../src/lib/agent";
import type { HubStaff } from "../src/lib/schemas";

test("isStaffQuestion detects team and employee requests", () => {
  assert.equal(isStaffQuestion("Кто директор в Таразе?"), true);
  assert.equal(isStaffQuestion("Покажи команду Almaty Hub"), true);
  assert.equal(isStaffQuestion("Who is the manager?"), true);
  assert.equal(isStaffQuestion("Алматыда қандай қызметкерлер бар?"), true);
  assert.equal(isStaffQuestion("Какие события есть на этой неделе?"), false);
});

test("staffAgentReply answers role-specific staff questions clearly", () => {
  const reply = staffAgentReply({
    latestMessage: "Кто директор в Таразе?",
    staff: [
      staff({
        id: "director",
        name: "Азиз Сейткали",
        role: "Директор",
        instagram: "@aziz_hub",
      }),
      staff({
        id: "manager",
        name: "Мария Алибекова",
        role: "Региональный менеджер",
        contact: "maria@astanahub.com",
      }),
      staff({
        id: "official",
        name: "Команда Zhambyl Hub",
        role: "Официальный аккаунт хаба",
        instagram: "@zhambyl_hub",
        source: "instagram_profile_demo",
      }),
    ],
    region: "zhambyl",
    city: "Тараз",
  });

  assert.match(reply, /Азиз Сейткали/);
  assert.match(reply, /Директор/);
  assert.match(reply, /@aziz_hub/);
  assert.doesNotMatch(reply, /Мария Алибекова/);
  assert.match(reply, /Официальный контакт хаба/);
  assert.match(reply, /@zhambyl_hub/);
});

test("staffAgentReply distinguishes official hub contacts from exact employees", () => {
  const reply = staffAgentReply({
    latestMessage: "Расскажи про сотрудников Astana Hub",
    staff: [
      staff({
        id: "official",
        hub: "Astana Hub",
        city: "Астана",
        region: "astana",
        name: "Команда Astana Hub",
        role: "Официальный аккаунт хаба",
        instagram: "@astana.hub",
        source: "instagram_profile_demo",
      }),
    ],
    region: "astana",
    city: "Астана",
  });

  assert.match(reply, /точные сотрудники пока не загружены/i);
  assert.match(reply, /@astana\.hub/);
});

test("staffAgentReply prioritizes the general director for director questions", () => {
  const reply = staffAgentReply({
    latestMessage: "Кто директор Astana Hub?",
    staff: [
      staff({
        id: "office_director",
        hub: "Astana Hub",
        city: "Астана",
        region: "astana",
        name: "Диан Айбашпанов",
        role: "Директор офиса регионального развития",
      }),
      staff({
        id: "ceo",
        hub: "Astana Hub",
        city: "Астана",
        region: "astana",
        name: "Магжан Мадиев",
        role: "Генеральный директор",
      }),
      staff({
        id: "managing_director",
        hub: "Astana Hub",
        city: "Астана",
        region: "astana",
        name: "Назгуль Байтемирова",
        role: "Управляющий директор",
      }),
    ],
    region: "astana",
    city: "Астана",
  });

  assert.ok(
    reply.indexOf("Магжан Мадиев") < reply.indexOf("Назгуль Байтемирова"),
  );
  assert.ok(
    reply.indexOf("Назгуль Байтемирова") < reply.indexOf("Диан Айбашпанов"),
  );
});

test("buildSystemPrompt labels exact people separately from official contacts", () => {
  const prompt = buildSystemPrompt({
    events: [],
    staff: [
      staff({
        id: "director",
        name: "Магжан Мадиев",
        role: "Генеральный директор",
        source: "instagram_post:https://www.instagram.com/p/example/",
      }),
      staff({
        id: "official",
        name: "Команда Astana Hub",
        role: "Официальный аккаунт хаба",
        instagram: "@astana.hub",
        source: "instagram_profile_manual",
      }),
    ],
    today: "2026-06-13",
    region: "astana",
    city: "Астана",
  });

  assert.match(prompt, /record_type = "official_hub_contact"/);
  assert.match(prompt, /"record_type": "person"/);
  assert.match(prompt, /"record_type": "official_hub_contact"/);
});

function staff(overrides: Partial<HubStaff>): HubStaff {
  return {
    id: "staff",
    hub: "Zhambyl Hub",
    city: "Тараз",
    region: "zhambyl",
    name: "Сотрудник",
    role: "Команда хаба",
    instagram: null,
    contact: null,
    source: "test",
    ...overrides,
  };
}
