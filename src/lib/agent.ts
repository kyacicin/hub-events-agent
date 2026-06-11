import { dateKey } from "@/lib/filter";
import { generateGeminiText } from "@/lib/gemini";
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

export async function callGeminiAgent({
  messages,
  events,
  staff,
  today = new Date(),
  region,
  city,
}: AgentRequest) {
  return generateGeminiText({
    maxOutputTokens: 1000,
    system: buildSystemPrompt({
      events,
      staff,
      today: dateKey(today),
      region,
      city,
    }),
    messages: toGeminiMessages(messages),
  });
}

function toGeminiMessages(messages: ChatMessage[]) {
  const mapped = messages.map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    content: message.content,
  }));
  const firstUserIndex = mapped.findIndex((message) => message.role === "user");

  return firstUserIndex === -1 ? mapped : mapped.slice(firstUserIndex);
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
5. Отвечать на языке последнего сообщения пользователя: на русском, казахском или английском.
6. Если пользователь просит события по всем городам, события в EVENTS_JSON даны по всем регионам — сгруппируй их по городам.

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
${JSON.stringify(events.map(toPromptEvent), null, 2)}

STAFF_JSON:
${JSON.stringify(staff.map(toPromptStaff), null, 2)}
`.trim();
}

function toPromptEvent(event: HubEvent) {
  return {
    hub: event.hub,
    instagram: event.instagram,
    city: event.city,
    title: event.title,
    date: event.date,
    time: event.time,
    format: event.format,
    address: event.address,
    zoom_link: event.zoom_link ?? null,
    description: event.description,
  };
}

function toPromptStaff(person: HubStaff) {
  return {
    hub: person.hub,
    city: person.city,
    name: person.name,
    role: person.role,
    instagram: person.instagram,
    contact: person.contact,
  };
}

export function fallbackAgentReply({
  latestMessage,
  events,
  staff,
  region,
  city,
  allRegions = false,
}: {
  latestMessage: string;
  events: HubEvent[];
  staff: HubStaff[];
  region: string | null;
  city: string | null;
  allRegions?: boolean;
}) {
  const language = detectLanguage(latestMessage);
  const staffQuestion = isStaffQuestion(latestMessage);

  if (!region && !allRegions) {
    if (language === "kk") {
      return "Қалаңызды нақтылаңызшы. Мысалы: Астана, Алматы, Тараз, Павлодар.";
    }
    return language === "en"
      ? "Please tell me your city. For example: Astana, Almaty, Taraz, Pavlodar."
      : "Уточните город, пожалуйста. Например: Астана, Алматы, Тараз, Павлодар.";
  }

  if (staffQuestion) {
    if (!staff.length) {
      if (language === "kk") {
        return `${city ?? "Бұл өңір"} бойынша команда деректері әлі жүктелмеген. Жаңартуларды хабтың Instagram парақшасынан қарауға болады.`;
      }
      return language === "en"
        ? `No team data is loaded for ${city ?? "this region"} yet. Check the hub's Instagram for updates.`
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

    if (language === "kk") {
      return `${city ?? "Өңір"} бойынша команда:\n${lines}`;
    }
    return language === "en"
      ? `Team of ${city ?? "the region"}:\n${lines}`
      : `Команда ${city ?? "региона"}:\n${lines}`;
  }

  if (!events.length) {
    if (language === "kk") {
      return `${city ?? "Бұл өңір"} бойынша алдағы оқиғалар табылмады. Жаңартуларды хабтың Instagram парақшасынан қадағалаңыз.`;
    }
    return language === "en"
      ? `No upcoming events found for ${city ?? "this region"}. Follow the hub's Instagram for updates.`
      : `По ${city ?? "этому региону"} предстоящие события не найдены. Следите за обновлениями в Instagram хаба.`;
  }

  const scopeKk = allRegions ? "Барлық хабтар" : city ?? "Өңір";
  const scopeEn = allRegions ? "all hubs" : city ?? "the region";
  const scopeRu = allRegions ? "всех хабов" : `города ${city ?? "регион"}`;
  const lead =
    language === "kk"
      ? `${scopeKk} бойынша ${events.length} алдағы оқиға таптым:`
      : language === "en"
        ? `Found ${events.length} upcoming events for ${scopeEn}:`
        : `Нашёл ${events.length} предстоящих события для ${scopeRu}:`;
  const lines = events
    .slice(0, allRegions ? 6 : 3)
    .map(
      (event) =>
        `[${formatLabel(event.format, language)}] ${event.title} / ${event.date}${event.time ? ` · ${event.time}` : ""}${allRegions ? ` · ${event.city}` : event.address ? ` · ${event.address}` : ""}`,
    )
    .join("\n");

  return `${lead}\n${lines}`;
}

export function detectLanguage(text: string): "kk" | "ru" | "en" {
  if (
    /[әіңғүұқөһ]/i.test(text) ||
    /\b(сәлем|қала|оқиға|іс-шара|қайда|қашан|аптада|барлық)\b/i.test(text)
  ) {
    return "kk";
  }

  return /[а-яё]/i.test(text) ? "ru" : "en";
}

/** Does the user want events across every hub rather than one region? */
export function wantsAllRegions(text: string) {
  return /(все\s?город|всех\s?город|по всем|всем хабам|барлық қала|барлық хаб|all\s?cit|all\s?hub|every\s?cit)/i.test(
    text,
  );
}

export function isStaffQuestion(text: string) {
  return /(команд|сотрудник|директор|менеджер|контакт|staff|team|қызметкер|команда|басшы|директор|байланыс)/i.test(
    text,
  );
}

function formatLabel(format: HubEvent["format"], language: "kk" | "ru" | "en") {
  if (language === "en") {
    return format.toUpperCase();
  }

  if (format === "online") {
    return "ОНЛАЙН";
  }

  if (format === "hybrid") {
    return "ГИБРИД";
  }

  return "ОФЛАЙН";
}
