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
  lang,
}: AgentRequest & { lang?: string }) {
  return generateGeminiText({
    maxOutputTokens: 1000,
    system: buildSystemPrompt({
      events,
      staff,
      today: dateKey(today),
      region,
      city,
      lang,
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
  lang,
}: {
  events: HubEvent[];
  staff: HubStaff[];
  today: string;
  region: string | null;
  city: string | null;
  lang?: string;
}) {
  let langInstruction = "Отвечать на языке последнего сообщения пользователя: на русском, казахском или английском.";
  if (lang === "KZ" || lang === "kk") {
    langInstruction = "ОТВЕЧАЙ СТРОГО НА КАЗАХСКОМ ЯЗЫКЕ! Твой ответ должен быть полностью на казахском языке.";
  } else if (lang === "EN" || lang === "en") {
    langInstruction = "RESPOND STRICTLY IN ENGLISH! Your reply must be entirely in English.";
  } else if (lang === "RU" || lang === "ru") {
    langInstruction = "ОТВЕЧАЙ СТРОГО НА РУССКОМ ЯЗЫКЕ! Твой ответ должен быть полностью на русском языке.";
  }

  return `
Ты — AI-ассистент региональных хабов Astana Hub в Казахстане.

Твоя задача:
1. Определить город/регион пользователя из диалога.
2. Если город не указан, попросить уточнить город.
3. Показать только предстоящие события для выбранного региона.
4. Если пользователь спрашивает про команду, сотрудников, директора, менеджера, ответственного или контакты, отвечать только по базе команды ниже.
5. ${langInstruction} Весь ответ должен быть на одном языке (названия событий и адреса можно оставить как в данных).
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
  lang,
}: {
  latestMessage: string;
  events: HubEvent[];
  staff: HubStaff[];
  region: string | null;
  city: string | null;
  allRegions?: boolean;
  lang?: string;
}) {
  const language = lang === "KZ" ? "kk" : lang === "EN" ? "en" : lang === "RU" ? "ru" : detectLanguage(latestMessage);
  const staffQuestion = isStaffQuestion(latestMessage);
  const knowledgeReply = astanaHubKnowledgeReply(latestMessage, lang);

  if (knowledgeReply) {
    return knowledgeReply;
  }

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
      return `${city ?? "Бұл өңір"} бойынша алдағы іс-шаралар табылмады. Жаңартуларды хабтың Instagram парақшасынан қадағалаңыз.`;
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
      ? `${scopeKk} бойынша ${events.length} алдағы іс-шара таптым:`
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

export function astanaHubKnowledgeReply(text: string, lang?: string) {
  const language = lang === "KZ" ? "kk" : lang === "EN" ? "en" : lang === "RU" ? "ru" : detectLanguage(text);
  const normalized = text.toLowerCase();

  if (
    /(tech\s*orda|тех\s*орда|тек\s*орда|it[-\s]?грант|ит[-\s]?грант|грант|grant|оқу гранты|грант алу)/i.test(normalized)
  ) {
    return techOrdaReply(language);
  }

  if (
    /(налог|льгот|салық|жеңілдік|tax|vat|ндс|ққс|кпн|ктс|ипн|жтс|social tax|социальн)/i.test(normalized)
  ) {
    return taxBenefitsReply(language);
  }

  if (
    /(польз|пайда|benefit|региональн|өңірлік|regional hub|хабтар|стартап)/i.test(normalized) &&
    /(региональн|өңірлік|regional hub|хабтар|хабов|стартап)/i.test(normalized)
  ) {
    return regionalHubsReply(language);
  }

  if (
    /(как\s+стать\s+резидент|стать\s+резидент|резидентом\s+astana|резиденті\s+қалай|қалай\s+резидент|become\s+(an\s+)?astana\s+hub\s+resident|residency)/i.test(normalized)
  ) {
    return residencyReply(language);
  }

  return null;
}

function techOrdaReply(language: "kk" | "ru" | "en") {
  if (language === "kk") {
    return [
      "Tech Orda IT-грантын алу тәртібі:",
      "1. Astana Hub немесе Tech Orda ресми парақшасында қабылдау мерзімін тексеріңіз.",
      "2. Серіктес IT-мектеп пен курсты таңдаңыз. Бағдарлама әдетте 18-35 жас аралығындағы ҚР азаматтарына арналған.",
      "3. Өтінімді онлайн толтырыңыз және мектептің ішкі іріктеуінен өтіңіз.",
      "4. Іріктеуден өтсеңіз, оқу келісімін растап, сабаққа қатысу талаптарын орындаңыз.",
      "5. Субсидия сомасы әдетте 600 000 теңгеге дейін, бірақ нақты квота, мектептер тізімі және дедлайн жыл сайын өзгеруі мүмкін.",
      "Ең дұрысы: соңғы дедлайн мен мектептер тізімін astanahub.com және Tech Orda ресми беттерінен тексеру.",
    ].join("\n");
  }

  if (language === "en") {
    return [
      "How to get a Tech Orda IT grant:",
      "1. Check the active intake dates on the official Astana Hub or Tech Orda page.",
      "2. Choose a partner IT school and course. The program is usually aimed at Kazakhstan citizens aged 18-35.",
      "3. Submit the online application and pass the selected school's screening.",
      "4. If approved, confirm the study agreement and meet the attendance/progress rules.",
      "5. The subsidy is usually up to 600,000 KZT, but quotas, school lists and deadlines can change each year.",
      "Best next step: verify the current deadline and partner schools on astanahub.com and the official Tech Orda page.",
    ].join("\n");
  }

  return [
    "Как получить ИТ-грант Tech Orda:",
    "1. Проверьте актуальный прием заявок на официальной странице Astana Hub или Tech Orda.",
    "2. Выберите партнерскую IT-школу и курс. Программа обычно рассчитана на граждан Казахстана 18-35 лет.",
    "3. Подайте онлайн-заявку и пройдите отбор выбранной школы.",
    "4. После одобрения подтвердите договор на обучение и соблюдайте требования по посещаемости и прогрессу.",
    "5. Субсидия обычно покрывает обучение до 600 000 тенге, но квоты, список школ и дедлайны меняются по годам.",
    "Практический шаг: перед подачей обязательно проверьте свежие сроки и список школ на astanahub.com и официальной странице Tech Orda.",
  ].join("\n");
}

function taxBenefitsReply(language: "kk" | "ru" | "en") {
  if (language === "kk") {
    return [
      "Astana Hub резиденттеріне арналған салықтық жеңілдіктердің негізгі логикасы:",
      "1. Жеңілдіктер тек Astana Hub қатысушысы мәртебесі бар компанияларға және рұқсат етілген IT-қызмет түрлеріне қолданылады.",
      "2. Әдетте КТС, ҚҚС, қызметкерлердің ЖТС және кейбір әлеуметтік төлемдер бойынша жеңілдіктер қарастырылады.",
      "3. Резидент компания есептілік пен қызмет түріне қойылатын талаптарды сақтауы керек.",
      "4. Шетелдік мамандарды тарту және визалық/еңбек рәсімдері бойынша жеңілдетілген мүмкіндіктер болуы мүмкін.",
      "Нақты қолдану үшін Astana Hub салықтық преференциялар офисінен немесе бухгалтерден тексеру керек, себебі ережелер мен талаптар жаңаруы мүмкін.",
    ].join("\n");
  }

  if (language === "en") {
    return [
      "Main tax benefit logic for Astana Hub residents:",
      "1. Benefits apply to companies with Astana Hub participant status and eligible IT activities.",
      "2. The common package includes preferences around corporate income tax, VAT, employee individual income tax and some social tax obligations.",
      "3. The resident company must keep activity, reporting and compliance requirements in order.",
      "4. There may also be simplified options for hiring foreign specialists and related visa/labor procedures.",
      "For exact application, confirm with Astana Hub's tax preferences office or a qualified accountant because rules and requirements can change.",
    ].join("\n");
  }

  return [
    "Какие налоговые льготы есть у резидентов Astana Hub:",
    "1. Льготы применяются к компаниям со статусом участника Astana Hub и к разрешенным IT-видам деятельности.",
    "2. Обычно пакет включает преференции по КПН, НДС, ИПН сотрудников и отдельным социальным налоговым обязательствам.",
    "3. Компания-резидент должна соблюдать требования по виду деятельности, отчетности и комплаенсу.",
    "4. Дополнительно могут быть упрощенные возможности для привлечения иностранных специалистов и оформления визово-трудовых процедур.",
    "Для точного применения лучше свериться с офисом налоговых преференций Astana Hub или бухгалтером: правила и требования могут обновляться.",
  ].join("\n");
}

function regionalHubsReply(language: "kk" | "ru" | "en") {
  if (language === "kk") {
    return [
      "Өңірлік хабтардың стартаптарға пайдасы:",
      "1. Жергілікті орта: коворкинг, кездесулер, менторлар және стартап-комьюнити қалаңызда қолжетімді болады.",
      "2. Бағдарламаларға кіру: Tech Orda, акселераторлар, инкубация, питч-сессиялар және грант мүмкіндіктері туралы бағыт береді.",
      "3. Нетворк: кәсіпкерлер, әзірлеушілер, инвесторлар, университеттер және мемлекеттік органдармен байланыс орнатады.",
      "4. Алғашқы traction: іс-шараларда өнімді тестілеуге, серіктес табуға және алғашқы клиенттермен сөйлесуге болады.",
      "5. Astana Hub экожүйесіне көпір: өңірдегі команда орталық бағдарламаларға қалай қатысу керегін түсіндіреді.",
    ].join("\n");
  }

  if (language === "en") {
    return [
      "How regional hubs help startups:",
      "1. Local infrastructure: coworking, meetups, mentors and a startup community become available in the founder's city.",
      "2. Program access: teams get guidance on Tech Orda, accelerators, incubation, pitch sessions and grant opportunities.",
      "3. Network: hubs connect founders with developers, investors, universities, corporates and public-sector partners.",
      "4. Early traction: events help teams test products, find partners and talk to first customers.",
      "5. Bridge to Astana Hub: regional teams explain how to enter national Astana Hub programs and resident opportunities.",
    ].join("\n");
  }

  return [
    "Какая польза от региональных хабов для стартапов:",
    "1. Локальная инфраструктура: коворкинг, митапы, менторы и стартап-сообщество появляются прямо в городе основателя.",
    "2. Доступ к программам: команда хаба помогает разобраться с Tech Orda, акселераторами, инкубацией, питч-сессиями и грантовыми возможностями.",
    "3. Нетворк: хабы соединяют стартапы с разработчиками, инвесторами, вузами, корпоративными партнерами и госорганами.",
    "4. Первые проверки рынка: на событиях можно протестировать продукт, найти партнеров и поговорить с первыми клиентами.",
    "5. Мост в экосистему Astana Hub: региональная команда объясняет, как попасть в национальные программы и оформить резидентство.",
  ].join("\n");
}

function residencyReply(language: "kk" | "ru" | "en") {
  if (language === "kk") {
    return [
      "Astana Hub резиденті болу қадамдары:",
      "1. Қазақстанда тіркелген заңды тұлға болуы керек, әдетте ЖШС форматы қолданылады.",
      "2. Компанияның қызметі Astana Hub рұқсат ететін IT-қызмет түрлеріне сәйкес болуы керек.",
      "3. astanahub.com порталында жеке кабинет ашып, резиденттікке онлайн өтінім бересіз.",
      "4. Компания, өнім, команда, қызмет түрі және құжаттар туралы ақпаратты жүктейсіз.",
      "5. Өтінім қаралғаннан кейін оң шешім болса, қатысушы мәртебесі беріледі және есептілік/комплаенс талаптарын сақтау керек.",
      "Егер дайындық керек болса, өңірлік хаб командасы құжаттар мен бағдарлама шарттарын түсіндіруге көмектесе алады.",
    ].join("\n");
  }

  if (language === "en") {
    return [
      "How to become an Astana Hub resident:",
      "1. Have a legal entity registered in Kazakhstan, usually an LLP.",
      "2. Make sure the company's activity fits the eligible IT activity categories for Astana Hub participants.",
      "3. Create an account on astanahub.com and submit the residency application online.",
      "4. Upload company, product, team, activity and supporting document information.",
      "5. After review, if approved, the company receives participant status and must follow reporting and compliance obligations.",
      "A regional hub team can help explain the documents and program conditions before submission.",
    ].join("\n");
  }

  return [
    "Как стать резидентом Astana Hub:",
    "1. Нужна зарегистрированная в Казахстане компания, чаще всего ТОО.",
    "2. Деятельность компании должна подходить под разрешенные IT-направления для участников Astana Hub.",
    "3. На astanahub.com создается кабинет и подается онлайн-заявка на резидентство.",
    "4. В заявке указывают данные о компании, продукте, команде, виде деятельности и прикладывают документы.",
    "5. После рассмотрения при одобрении компания получает статус участника и соблюдает требования по отчетности и комплаенсу.",
    "Если нужно подготовиться, региональный хаб может помочь разобраться с документами и условиями программы перед подачей.",
  ].join("\n");
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
  lang,
}: {
  latestMessage: string;
  staff: HubStaff[];
  region: string | null;
  city: string | null;
  allRegions?: boolean;
  lang?: string;
}) {
  const language = lang === "KZ" ? "kk" : lang === "EN" ? "en" : lang === "RU" ? "ru" : detectLanguage(latestMessage);

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
      return `${city ?? "Бұл өңір"} бойынша команда деректері әлі жүктелмеді. Нақты қызметкерлер жоқ, ресми байланыстарды хабтың Instagram парақшасынан тексеруге болады.`;
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

  const name = localizeAgentName(person.name, language);
  return detailText ? `${index}. ${name} — ${detailText}` : `${index}. ${name}`;
}

function formatOfficialContactLine(
  person: HubStaff,
  index: number,
  language: "kk" | "ru" | "en",
) {
  const contact = contactText(person, language);
  const city = localizeAgentCity(person.city, language);
  const cityPart = `, ${city}`;
  return `${index}. ${person.hub}${cityPart}${contact ? ` — ${contact}` : ""}`;
}

function roleLabel(role: string, language: "kk" | "ru" | "en") {
  if (language === "kk") {
    return `рөлі: ${localizeAgentRole(role, language)}`;
  }

  if (language === "en") {
    return `role: ${localizeAgentRole(role, language)}`;
  }

  return `роль: ${role}`;
}

function localizeAgentRole(role: string, language: "kk" | "ru" | "en") {
  if (language === "kk") {
    if (role === "Официальный аккаунт хаба") return "хабтың ресми аккаунты";
    if (role === "Генеральный директор") return "бас директор";
    if (role === "Управляющий директор") return "басқарушы директор";
    if (role === "Директор офиса регионального развития") return "өңірлік даму кеңсесінің директоры";
    if (role === "Директор офиса регулирования") return "реттеу кеңсесінің директоры";
    if (role === "Главный менеджер по регулированию") return "реттеу бойынша бас менеджер";
    if (role === "Старший менеджер по регулированию") return "реттеу бойынша аға менеджер";
    if (role === "Менеджер Alatau Hub") return "Alatau Hub менеджері";
    if (role === "Региональный менеджер") return "өңірлік менеджер";
    if (role === "Команда хаба") return "хаб командасы";
    if (role === "Основатель Terricon Valley & Координатор") return "Terricon Valley негізін қалаушы және координатор";
  }

  if (language === "en") {
    if (role === "Официальный аккаунт хаба") return "official hub account";
    if (role === "Генеральный директор") return "CEO";
    if (role === "Управляющий директор") return "managing director";
    if (role === "Директор офиса регионального развития") return "director of regional development office";
    if (role === "Директор офиса регулирования") return "director of regulation office";
    if (role === "Главный менеджер по регулированию") return "chief regulation manager";
    if (role === "Старший менеджер по регулированию") return "senior regulation manager";
    if (role === "Менеджер Alatau Hub") return "Alatau Hub manager";
    if (role === "Региональный менеджер") return "regional manager";
    if (role === "Команда хаба") return "hub team";
    if (role === "Основатель Terricon Valley & Координатор") return "Terricon Valley founder and coordinator";
    if (role === "Директор") return "director";
  }

  return role;
}

function localizeAgentName(name: string, language: "kk" | "ru" | "en") {
  const teamMatch = name.match(/^Команда\s+(.+)$/);
  if (!teamMatch || language === "ru") return name;
  if (language === "kk") return `${teamMatch[1]} командасы`;
  return `${teamMatch[1]} team`;
}

function localizeAgentCity(city: string, language: "kk" | "ru" | "en") {
  if (language === "ru") return city;
  const cities: Record<string, { kk: string; en: string }> = {
    "Туркестан": { kk: "Түркістан", en: "Turkistan" },
    "Уральск": { kk: "Орал", en: "Uralsk" },
    "Оскемен": { kk: "Өскемен", en: "Oskemen" },
    "Актобе": { kk: "Ақтөбе", en: "Aktobe" },
    "Кокшетау": { kk: "Көкшетау", en: "Kokshetau" },
    "Актау": { kk: "Ақтау", en: "Aktau" },
    "Кызылорда": { kk: "Қызылорда", en: "Kyzylorda" },
    "Жезказган": { kk: "Жезқазған", en: "Zhezkazgan" },
    "Талдыкорган": { kk: "Талдықорған", en: "Taldykorgan" },
    "Костанай": { kk: "Қостанай", en: "Kostanay" },
    "Петропавловск": { kk: "Петропавл", en: "Petropavlovsk" },
  };
  if (language === "kk") return cities[city]?.kk ?? city;
  return cities[city]?.en ?? city;
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
