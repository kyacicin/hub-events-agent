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
4. Если пользователь спрашивает про команду, сотрудников, директора, менеджера, ответственного или контакты, отвечать только по базе команды ниже.
5. Отвечать на языке последнего сообщения пользователя: на русском, казахском или английском. Весь ответ должен быть на одном языке (названия событий и адреса можно оставить как в данных).
6. Если пользователь просит события по всем городам, события в EVENTS_JSON даны по всем регионам — сгруппируй их по городам.

Правила:
- Не выдумывай события, сотрудников, адреса, даты, ссылки или контакты.
- Используй только данные из базы событий и базы команды ниже.
- События уже отфильтрованы по date >= today и по региону, если регион найден.
- Формат события в тексте: [ФОРМАТ] Название / Дата · Время · Адрес / Описание.
- Если событий нет, честно скажи об этом.
- Если база команды содержит только общий контакт хаба, так и скажи: "точные сотрудники пока не загружены, можно написать в официальный Instagram".
- Записи с record_type = "official_hub_contact" — это только общий контакт хаба, не конкретный сотрудник. Не называй их сотрудниками, директорами, менеджерами или командой людей.
- Конкретными сотрудниками являются только записи с record_type = "person". Если таких записей нет, скажи, что точные сотрудники пока не загружены, и дай официальный Instagram хаба.
- Для вопросов про команду обязательно перечисли каждого доступного сотрудника отдельной строкой: имя — роль — Instagram/contact.
- Если пользователь спрашивает конкретную роль (директор, менеджер, руководитель), сначала покажи сотрудников с этой ролью. Если такой роли нет в базе команды, прямо скажи, что такой сотрудник в базе не найден, и покажи доступные контакты хаба.
- Не смешивай ответ про команду с событиями, если пользователь явно не просит события.
- Не возвращай JSON. Пиши короткий, пригодный для чата ответ.
- Пиши простым текстом без markdown-разметки: никаких **, *, #, заголовков и эмодзи.

Текущий region key: ${region ?? "unknown"}
Текущий город: ${city ?? "unknown"}
Сегодняшняя дата: ${today}

База событий:
${JSON.stringify(events.map(toPromptEvent), null, 2)}

База команды:
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
    record_type: isOfficialHubContact(person) ? "official_hub_contact" : "person",
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
    return staffAgentReply({
      latestMessage,
      staff,
      region,
      city,
      allRegions,
    });
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
  return /(команд|сотрудник|работник|директор|менеджер|руководител|организатор|ответственн|контакт|кто\s|staff|team|employee|director|manager|lead|contact|қызметкер|команда|басшы|жетекші|ұйымдастырушы|жауапты|байланыс|кім\s)/i.test(
    text,
  );
}

export function staffAgentReply({
  latestMessage,
  staff,
  region,
  city,
  allRegions = false,
}: {
  latestMessage: string;
  staff: HubStaff[];
  region: string | null;
  city: string | null;
  allRegions?: boolean;
}) {
  const language = detectLanguage(latestMessage);

  if (!region && !allRegions) {
    if (language === "kk") {
      return "Қай қаладағы команда керек екенін нақтылаңызшы. Мысалы: Тараз командасы немесе Алматыдағы қызметкерлер.";
    }
    return language === "en"
      ? "Please specify the city or hub. For example: Taraz team or employees in Almaty."
      : "Уточните город или хаб, пожалуйста. Например: команда Тараза или сотрудники в Алматы.";
  }

  if (!staff.length) {
    if (language === "kk") {
      return `${city ?? "Бұл өңір"} бойынша команда деректері әлі жүктелмеген. Нақты қызметкерлер жоқ, ресми байланыстарды хабтың Instagram парақшасынан тексеруге болады.`;
    }
    return language === "en"
      ? `No team data is loaded for ${city ?? "this region"} yet. Exact employees are not available; check the hub's official Instagram for contacts.`
      : `По ${city ?? "этому региону"} данные команды пока не загружены. Точных сотрудников в базе нет, контакты можно проверить в официальном Instagram хаба.`;
  }

  const { people, officialContacts } = splitStaffRecords(staff);
  const roleHints = staffRoleHints(latestMessage);
  const visiblePeople = roleHints.length
    ? sortStaffForRoleQuery(
        people.filter((person) => staffMatchesRoleHints(person, roleHints)),
        roleHints,
      )
    : people;

  if (roleHints.length && !visiblePeople.length) {
    return roleNotFoundReply({
      language,
      city,
      allRegions,
      people,
      contacts: officialContacts,
    });
  }

  if (!visiblePeople.length && officialContacts.length) {
    return officialContactOnlyReply({
      language,
      city,
      allRegions,
      contacts: officialContacts,
    });
  }

  const scope = staffScope(language, city, allRegions);
  const lines = visiblePeople.map((person, index) =>
    formatStaffLine(person, index + 1, language),
  );
  const contactLines = officialContacts.map((person, index) =>
    formatOfficialContactLine(person, index + 1, language),
  );

  if (language === "kk") {
    return [
      `${scope} командасы бойынша базада ${visiblePeople.length} нақты қызметкер бар:`,
      ...lines,
      contactLines.length ? "Ресми байланыс:" : null,
      ...contactLines,
    ].filter(Boolean).join("\n");
  }

  if (language === "en") {
    return [
      `I found ${visiblePeople.length} exact team member${visiblePeople.length === 1 ? "" : "s"} for ${scope}:`,
      ...lines,
      contactLines.length ? "Official hub contact:" : null,
      ...contactLines,
    ].filter(Boolean).join("\n");
  }

  return [
    `По ${scope} в базе есть ${visiblePeople.length} точн${visiblePeople.length === 1 ? "ый сотрудник" : "ых сотрудника"}:`,
    ...lines,
    contactLines.length ? "Официальный контакт хаба:" : null,
    ...contactLines,
  ].filter(Boolean).join("\n");
}

function splitStaffRecords(staff: HubStaff[]) {
  return {
    people: staff.filter((person) => !isOfficialHubContact(person)),
    officialContacts: staff.filter(isOfficialHubContact),
  };
}

function isOfficialHubContact(person: HubStaff) {
  const name = person.name.toLowerCase();
  const role = person.role?.toLowerCase() ?? "";
  return (
    name.startsWith("команда ") ||
    role.includes("официальный аккаунт") ||
    person.source.includes("profile")
  );
}

function staffRoleHints(text: string) {
  const hints: string[] = [];

  if (/(директор|director|басшы|жетекші|руководител|lead)/i.test(text)) {
    hints.push("директор", "director", "басшы", "жетекші", "руководител");
  }

  if (/(менеджер|manager)/i.test(text)) {
    hints.push("менеджер", "manager");
  }

  return hints;
}

function staffMatchesRoleHints(person: HubStaff, roleHints: string[]) {
  const role = person.role?.toLowerCase() ?? "";
  const name = person.name.toLowerCase();
  return roleHints.some((hint) => role.includes(hint) || name.includes(hint));
}

function sortStaffForRoleQuery(staff: HubStaff[], roleHints: string[]) {
  return [...staff].sort((a, b) => {
    const priorityDiff =
      staffRolePriority(a, roleHints) - staffRolePriority(b, roleHints);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.name.localeCompare(b.name);
  });
}

function staffRolePriority(person: HubStaff, roleHints: string[]) {
  const role = person.role?.toLowerCase() ?? "";

  if (roleHints.includes("директор")) {
    if (/(генеральн|ceo|chief executive)/i.test(role)) return 0;
    if (/^директор$/i.test(role.trim())) return 1;
    if (/(управляющ|managing)/i.test(role)) return 2;
    if (role.includes("директор")) return 3;
  }

  if (roleHints.includes("менеджер")) {
    if (/^менеджер$/i.test(role.trim())) return 0;
    if (role.includes("региональн")) return 1;
    if (role.includes("менеджер")) return 2;
  }

  return 10;
}

function staffScope(
  language: "kk" | "ru" | "en",
  city: string | null,
  allRegions: boolean,
) {
  if (language === "kk") {
    return allRegions ? "барлық хабтар" : city ?? "өңір";
  }

  if (language === "en") {
    return allRegions ? "all hubs" : city ?? "the region";
  }

  return allRegions ? "всем хабам" : city ? `городу ${city}` : "этому региону";
}

function formatStaffLine(
  person: HubStaff,
  index: number,
  language: "kk" | "ru" | "en",
) {
  const details = [
    person.role ? roleLabel(person.role, language) : null,
    contactText(person, language),
  ].filter(Boolean);
  const detailText = details.join(". ");

  return detailText ? `${index}. ${person.name} — ${detailText}` : `${index}. ${person.name}`;
}

function formatOfficialContactLine(
  person: HubStaff,
  index: number,
  language: "kk" | "ru" | "en",
) {
  const contact = contactText(person, language);
  const cityPart = language === "ru" ? `, ${person.city}` : `, ${person.city}`;
  return `${index}. ${person.hub}${cityPart}${contact ? ` — ${contact}` : ""}`;
}

function roleLabel(role: string, language: "kk" | "ru" | "en") {
  if (language === "kk") {
    return `рөлі: ${role}`;
  }

  if (language === "en") {
    return `role: ${role}`;
  }

  return `роль: ${role}`;
}

function contactText(person: HubStaff, language: "kk" | "ru" | "en") {
  const contacts = [
    person.instagram ? `Instagram: ${person.instagram}` : null,
    person.contact ? `${contactLabel(language)}: ${person.contact}` : null,
  ].filter(Boolean);

  return contacts.join(", ");
}

function contactLabel(language: "kk" | "ru" | "en") {
  if (language === "kk") return "байланыс";
  if (language === "en") return "contact";
  return "контакт";
}

function officialContactOnlyReply({
  language,
  city,
  allRegions,
  contacts,
}: {
  language: "kk" | "ru" | "en";
  city: string | null;
  allRegions: boolean;
  contacts: HubStaff[];
}) {
  const lines = contacts.map((person, index) =>
    formatOfficialContactLine(person, index + 1, language),
  );
  const scope = staffScope(language, city, allRegions);

  if (language === "kk") {
    return [
      `${scope} бойынша нақты қызметкерлер әлі жүктелмеген. Базада тек ресми байланыс бар:`,
      ...lines,
    ].join("\n");
  }

  if (language === "en") {
    return [
      `Exact employees for ${scope} are not loaded yet. The database only has the official hub contact:`,
      ...lines,
    ].join("\n");
  }

  return [
    `По ${scope} точные сотрудники пока не загружены. В базе есть только официальный контакт хаба:`,
    ...lines,
  ].join("\n");
}

function roleNotFoundReply({
  language,
  city,
  allRegions,
  people,
  contacts,
}: {
  language: "kk" | "ru" | "en";
  city: string | null;
  allRegions: boolean;
  people: HubStaff[];
  contacts: HubStaff[];
}) {
  const scope = staffScope(language, city, allRegions);
  const peopleLines = people.map((person, index) =>
    formatStaffLine(person, index + 1, language),
  );
  const contactLines = contacts.map((person, index) =>
    formatOfficialContactLine(person, index + 1, language),
  );

  if (language === "kk") {
    return [
      `${scope} бойынша сұралған рөлдегі қызметкер жергілікті команда базасында табылмады.`,
      peopleLines.length ? "Базада бар қызметкерлер:" : null,
      ...peopleLines,
      contactLines.length ? "Ресми байланыс:" : null,
      ...contactLines,
    ].filter(Boolean).join("\n");
  }

  if (language === "en") {
    return [
      `I did not find a team member with that role for ${scope} in the local team database.`,
      peopleLines.length ? "Available team records:" : null,
      ...peopleLines,
      contactLines.length ? "Official hub contact:" : null,
      ...contactLines,
    ].filter(Boolean).join("\n");
  }

  return [
    `По ${scope} сотрудник с такой ролью в локальной базе команды не найден.`,
    peopleLines.length ? "Доступные сотрудники в базе:" : null,
    ...peopleLines,
    contactLines.length ? "Официальный контакт хаба:" : null,
    ...contactLines,
  ].filter(Boolean).join("\n");
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
