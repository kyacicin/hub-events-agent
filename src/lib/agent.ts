import Anthropic from "@anthropic-ai/sdk";
import { dateKey } from "@/lib/filter";
import type { HubEvent, HubStaff } from "@/lib/schemas";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type AgentRequest = {
  messages: ChatMessage[];
  events: HubEvent[];
  staff: HubStaff[];
  today?: string | Date;
  region: string | null;
  city: string | null;
};

export async function callClaudeAgent({
  messages,
  events,
  staff,
  today = new Date(),
  region,
  city,
}: AgentRequest) {
  const client = new Anthropic({ apiKey: requiredEnv("ANTHROPIC_API_KEY") });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  const response = await client.messages.create({
    model,
    max_tokens: 1000,
    system: buildSystemPrompt({
      events,
      staff,
      today: dateKey(today),
      region,
      city,
    }),
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}

export function buildSystemPrompt({
  events,
  staff,
  today,
  region,
  city,
}: {
  events: HubEvent[];
  staff: HubStaff[];
  today: string;
  region: string | null;
  city: string | null;
}) {
  return `
Ты — AI-ассистент региональных хабов Astana Hub в Казахстане.

Твоя задача:
1. Определить город/регион пользователя из диалога.
2. Если город не указан, попросить уточнить город.
3. Показать только предстоящие события для выбранного региона.
4. Если пользователь спрашивает про команду, ответить по базе команды.
5. Отвечать на русском или казахском языке в зависимости от языка последнего сообщения пользователя.

Правила:
- Не выдумывай события, сотрудников, адреса, даты, ссылки или контакты.
- Используй только данные из EVENTS_JSON и STAFF_JSON ниже.
- События уже отфильтрованы по date >= today и по региону, если регион найден.
- Формат события в тексте: [ФОРМАТ] Название / Дата · Время · Адрес / Описание.
- Если событий нет, честно скажи об этом.
- Если STAFF_JSON содержит только общий контакт хаба, так и скажи: "точные сотрудники пока не загружены, можно написать в официальный Instagram".
- Не возвращай JSON. Пиши короткий, пригодный для чата ответ.

Текущий region key: ${region ?? "unknown"}
Текущий город: ${city ?? "unknown"}
Сегодняшняя дата: ${today}

EVENTS_JSON:
${JSON.stringify(events, null, 2)}

STAFF_JSON:
${JSON.stringify(staff, null, 2)}
`.trim();
}

export function fallbackAgentReply({
  latestMessage,
  events,
  staff,
  region,
  city,
}: {
  latestMessage: string;
  events: HubEvent[];
  staff: HubStaff[];
  region: string | null;
  city: string | null;
}) {
  const language = detectLanguage(latestMessage);
  const staffQuestion = isStaffQuestion(latestMessage);

  if (!region) {
    return language === "kk"
      ? "Қалаңызды нақтылаңызшы. Мысалы: Астана, Алматы, Тараз, Павлодар."
      : "Уточните город, пожалуйста. Например: Астана, Алматы, Тараз, Павлодар.";
  }

  if (staffQuestion) {
    if (!staff.length) {
      return language === "kk"
        ? `${city ?? "Бұл өңір"} бойынша команда деректері әлі жүктелмеген. Жаңартуларды хабтың Instagram парақшасынан қарауға болады.`
        : `По ${city ?? "этому региону"} данные команды пока не загружены. Можно проверить обновления в Instagram хаба.`;
    }

    const lines = staff
      .map((person) =>
        [
          person.name,
          person.role,
          person.instagram,
          person.contact,
        ]
          .filter(Boolean)
          .join(" · "),
      )
      .join("\n");

    return language === "kk"
      ? `${city ?? "Өңір"} бойынша команда:\n${lines}`
      : `Команда ${city ?? "региона"}:\n${lines}`;
  }

  if (!events.length) {
    return language === "kk"
      ? `${city ?? "Бұл өңір"} бойынша алдағы оқиғалар табылмады. Жаңартуларды хабтың Instagram парақшасынан қадағалаңыз.`
      : `По ${city ?? "этому региону"} предстоящие события не найдены. Следите за обновлениями в Instagram хаба.`;
  }

  const lead =
    language === "kk"
      ? `${city ?? "Өңір"} бойынша ${events.length} алдағы оқиға таптым:`
      : `Нашёл ${events.length} предстоящих события для города ${city ?? "регион"}:`;
  const lines = events
    .slice(0, 3)
    .map(
      (event) =>
        `[${formatLabel(event.format)}] ${event.title} / ${event.date}${event.time ? ` · ${event.time}` : ""}${event.address ? ` · ${event.address}` : ""}`,
    )
    .join("\n");

  return `${lead}\n${lines}`;
}

export function detectLanguage(text: string) {
  return /[әіңғүұқөһ]/i.test(text) ||
    /\b(сәлем|қала|оқиға|іс-шара|команда|қайда|қашан)\b/i.test(text)
    ? "kk"
    : "ru";
}

export function isStaffQuestion(text: string) {
  return /(команд|сотрудник|директор|менеджер|контакт|staff|team|қызметкер|команда|басшы|директор|байланыс)/i.test(
    text,
  );
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function formatLabel(format: HubEvent["format"]) {
  if (format === "online") {
    return "ОНЛАЙН";
  }

  if (format === "hybrid") {
    return "ГИБРИД";
  }

  return "ОФЛАЙН";
}
