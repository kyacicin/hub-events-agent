// UI localization for the HubVibe Portal (RU / KZ / EN).
// The agent itself mirrors the language of the user's question server-side;
// this dictionary only covers interface chrome.

export type Lang = 'ru' | 'kk' | 'en';

export const LANGS: Array<{ code: Lang; label: string }> = [
  { code: 'kk', label: 'KZ' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

type Dict = Record<string, string>;

const ru: Dict = {
  connectedTo: 'Подключено к:',
  activeHub: 'Активный хаб',
  tabEvents: 'События',
  tabTeam: 'Команда',
  chatIntro1:
    'Сәлем! Я ИИ-ассистент региональных хабов Astana Hub. Напишите свой город — найду предстоящие события, форматы, адреса и контакты команды.',
  chatIntro2:
    'Например: «Привет, я из Тараза. Что есть в ближайшее время?» — или воспользуйтесь быстрыми действиями внизу.',
  chatPlaceholder: 'Напишите свой город и вопрос...',
  chatYou: 'Вы',
  chatNewLine: 'Shift + Enter — новая строка',
  chatSend: 'Отправить',
  chatThinking: 'Агент анализирует базу событий...',
  chatSearching: 'Ищу события и контакты:',
  chatOk: 'Все системы работают',
  chatFallbackNote: 'Ответ собран локально без Gemini API.',
  chatError: 'Не удалось получить ответ агента.',
  chatTryLater: 'Попробуйте ещё раз чуть позже.',
  actionFindEvents: 'Найти события',
  actionAllCities: 'Все города',
  actionOnline: 'Онлайн',
  actionThisWeek: 'На этой неделе',
  promptFindEvents: 'Какие события есть в ближайшее время?',
  promptAllCities: 'Покажи события во всех городах',
  promptOnline: 'Какие онлайн-события есть в ближайшее время?',
  promptThisWeek: 'Что проходит на этой неделе?',
  showMap: 'Показать маршрут',
  hideMap: 'Скрыть карту',
  openPost: 'Открыть пост',
  addCalendar: 'В календарь',
  addedCalendar: 'сохранено в календарь! (демо)',
  teamContacts: 'Контакты команды',
  openTeamDeck: 'Открыть команду',
  moreInPanel: 'ещё в панели «События»',
  regionalEvents: 'События региона',
  noEvents: 'Предстоящих событий в этом регионе пока нет.',
  route: 'Маршрут (Mini-Map)',
  saveEvent: 'Сохранить событие',
  removeBookmark: 'Убрать закладку',
  savedToast: 'сохранено в закладки!',
  removedToast: 'убрано из сохранённых',
  teamDeck: 'Команда хабов',
  directorySynced: 'Справочник обновлён',
  noTeam: 'Данные о команде пока не загружены.',
  showContacts: 'Показать контакты',
  hideContacts: 'Скрыть контакты',
  noContacts: 'Личные контакты не опубликованы — напишите в официальный Instagram хаба.',
  contactsRevealed: 'Контакты открыты:',
  weeklyTimetable: 'Расписание недели',
  liveCalendar: 'Живой календарь',
  noDayEvents: 'Нет событий',
  activeBooking: 'Событие',
  close: 'Закрыть',
  timeTbd: 'время уточняется',
  routeOnMap: 'Показать маршрут на карте',
  routePlanner: 'Планировщик маршрута',
  routeStart: 'Старт',
  routeDest: 'Точка назначения',
  hubNetwork: 'Сеть региональных хабов',
  hubMapTitle: 'Карта хабов Казахстана',
  hubsOnMap: 'Хабов на карте',
  expandMap: 'Расширить карту',
  collapseMap: 'Свернуть карту',
  myLocation: 'Моё местоположение',
  locating: 'Ищу...',
  selectHub: 'Выбрать хаб',
  selectedHub: 'Выбранный хаб',
  exactAddress: 'Точный адрес из локальной базы',
  cityAddressFallback: 'Адрес уровня города: улица не найдена в локальных постах',
  routeDistance: 'Расстояние',
  meterUnit: 'м',
  kilometerUnit: 'км',
  open2gisRoute: 'Маршрут в 2GIS',
  locationDenied: 'Браузер не дал доступ к геолокации.',
  locationUnsupported: 'Геолокация недоступна в этом браузере.',
  locationError: 'Не удалось определить местоположение.',
  plottingRoute: 'Строю маршрут:',
  plottingInline: 'Строю интерактивный маршрут внутри чата...',
  switchedHub: 'Активный хаб:',
  openedTeamDeck: 'Команда открыта!',
  agentRequestError: 'Ошибка запроса к агенту',
  bioSource: 'Данные собраны из Instagram хаба.',
  askAI: 'Спросить ИИ',
  askAIAboutRole: 'Спросить ИИ об этой роли',
  mon: 'Понедельник', tue: 'Вторник', wed: 'Среда', thu: 'Четверг',
  fri: 'Пятница', sat: 'Суббота', sun: 'Воскресенье',
};

const kk: Dict = {
  connectedTo: 'Қосылған хаб:',
  activeHub: 'Белсенді хаб',
  tabEvents: 'Іс-шаралар',
  tabTeam: 'Команда',
  chatIntro1:
    'Сәлем! Мен Astana Hub өңірлік хабтарының ЖИ ассистентімін. Қалаңызды жазыңыз — алдағы іс-шараларды, форматтарды, мекенжайларды және команда байланыстарын табамын.',
  chatIntro2:
    'Мысалы: «Сәлем, мен Таразданмын. Жақын арада не бар?» — немесе төмендегі жылдам әрекеттерді пайдаланыңыз.',
  chatPlaceholder: 'Қалаңыз бен сұрағыңызды жазыңыз...',
  chatYou: 'Сіз',
  chatNewLine: 'Shift + Enter — жаңа жол',
  chatSend: 'Жіберу',
  chatThinking: 'Агент іс-шаралар дерекқорын талдап жатыр...',
  chatSearching: 'Іс-шаралар мен байланыстарды іздеймін:',
  chatOk: 'Барлық жүйелер жұмыс істейді',
  chatFallbackNote: 'Жауап Gemini API қолданбай, жергілікті деректер бойынша құрастырылды.',
  chatError: 'Агенттен жауап алу мүмкін болмады.',
  chatTryLater: 'Сәл кейінірек қайталап көріңіз.',
  actionFindEvents: 'Іс-шараларды табу',
  actionAllCities: 'Барлық қалалар',
  actionOnline: 'Онлайн',
  actionThisWeek: 'Осы аптада',
  promptFindEvents: 'Жақын арада қандай іс-шаралар бар?',
  promptAllCities: 'Барлық қалалардағы іс-шараларды көрсет',
  promptOnline: 'Қандай онлайн іс-шаралар бар?',
  promptThisWeek: 'Осы аптада не өтеді?',
  showMap: 'Маршрутты көрсету',
  hideMap: 'Картаны жасыру',
  openPost: 'Постты ашу',
  addCalendar: 'Күнтізбеге',
  addedCalendar: 'күнтізбеге сақталды! (демо)',
  teamContacts: 'Команда байланыстары',
  openTeamDeck: 'Команданы ашу',
  moreInPanel: 'тағысы — «Іс-шаралар» панелінде',
  regionalEvents: 'Өңірлік іс-шаралар',
  noEvents: 'Бұл өңірде алдағы іс-шаралар әзірге жоқ.',
  route: 'Маршрут (Mini-Map)',
  saveEvent: 'Іс-шараны сақтау',
  removeBookmark: 'Бетбелгіні алып тастау',
  savedToast: 'бетбелгілерге сақталды',
  removedToast: 'сақталғандардан алынды',
  teamDeck: 'Хаб командасы',
  directorySynced: 'Анықтамалық жаңартылды',
  noTeam: 'Команда туралы деректер әлі жүктелмеді.',
  showContacts: 'Контактілерді көрсету',
  hideContacts: 'Контактілерді жасыру',
  noContacts: 'Жеке контактілер жарияланбаған — хабтың ресми Instagram-ына жазыңыз.',
  contactsRevealed: 'Контактілер ашылды:',
  weeklyTimetable: 'Апталық кесте',
  liveCalendar: 'Жанды күнтізбе',
  noDayEvents: 'Іс-шаралар жоқ',
  activeBooking: 'Іс-шара',
  close: 'Жабу',
  timeTbd: 'уақыты нақтыланады',
  routeOnMap: 'Картадан маршрутты көрсету',
  routePlanner: 'Маршрут жоспарлағышы',
  routeStart: 'Бастапқы нүкте',
  routeDest: 'Баратын жер',
  hubNetwork: 'Өңірлік хабтар желісі',
  hubMapTitle: 'Қазақстандағы хабтар картасы',
  hubsOnMap: 'Картадағы хабтар',
  expandMap: 'Картаны үлкейту',
  collapseMap: 'Картаны кішірейту',
  myLocation: 'Менің орналасқан жерім',
  locating: 'Ізделуде...',
  selectHub: 'Хабты таңдау',
  selectedHub: 'Таңдалған хаб',
  exactAddress: 'Жергілікті дерекқордағы нақты мекенжай',
  cityAddressFallback: 'Қала деңгейіндегі мекенжай: көше жергілікті жазбалардан табылмады',
  routeDistance: 'Қашықтық',
  meterUnit: 'м',
  kilometerUnit: 'км',
  open2gisRoute: '2GIS арқылы маршрут',
  locationDenied: 'Браузер геолокацияға рұқсат бермеді.',
  locationUnsupported: 'Бұл браузерде геолокация қолжетімсіз.',
  locationError: 'Орналасқан жеріңізді анықтау мүмкін болмады.',
  plottingRoute: 'Маршрут құрылуда:',
  plottingInline: 'Чат ішінде интерактивті маршрут құрып жатырмын...',
  switchedHub: 'Белсенді хаб:',
  openedTeamDeck: 'Команда бөлімі ашылды!',
  agentRequestError: 'Агент сұранысында қате пайда болды',
  bioSource: 'Деректер хабтың Instagram парақшасынан жиналған.',
  askAI: 'ЖИ-дан сұрау',
  askAIAboutRole: 'Рөлі туралы ЖИ-дан сұрау',
  mon: 'Дүйсенбі', tue: 'Сейсенбі', wed: 'Сәрсенбі', thu: 'Бейсенбі',
  fri: 'Жұма', sat: 'Сенбі', sun: 'Жексенбі',
};

const en: Dict = {
  connectedTo: 'Connected to:',
  activeHub: 'Active hub',
  tabEvents: 'Events',
  tabTeam: 'Team',
  chatIntro1:
    "Hi! I'm the AI assistant of Astana Hub regional hubs. Tell me your city — I'll find upcoming events, formats, addresses and team contacts.",
  chatIntro2:
    'For example: "Hi, I\'m from Taraz. What\'s coming up?" — or use the quick actions below.',
  chatPlaceholder: 'Type your city and question...',
  chatYou: 'You',
  chatNewLine: 'Shift + Enter — new line',
  chatSend: 'Send',
  chatThinking: 'Agent is analyzing the events database...',
  chatSearching: 'Searching events and contacts:',
  chatOk: 'All systems operational',
  chatFallbackNote: 'Reply built locally without the Gemini API.',
  chatError: 'Could not get a response from the agent.',
  chatTryLater: 'Please try again in a moment.',
  actionFindEvents: 'Find events',
  actionAllCities: 'All cities',
  actionOnline: 'Online',
  actionThisWeek: 'This week',
  promptFindEvents: 'What events are coming up?',
  promptAllCities: 'Show events in all cities',
  promptOnline: 'What online events are coming up?',
  promptThisWeek: "What's happening this week?",
  showMap: 'Show route',
  hideMap: 'Hide map',
  openPost: 'Open post',
  addCalendar: 'Add to calendar',
  addedCalendar: 'saved to calendar! (demo)',
  teamContacts: 'Team contacts',
  openTeamDeck: 'Open team',
  moreInPanel: 'more in the Events panel',
  regionalEvents: 'Regional events',
  noEvents: 'No upcoming events in this region yet.',
  route: 'Route (Mini-Map)',
  saveEvent: 'Save event',
  removeBookmark: 'Remove bookmark',
  savedToast: 'saved to bookmarks!',
  removedToast: 'removed from saved',
  teamDeck: 'Hub team',
  directorySynced: 'Directory synced',
  noTeam: 'Team data is not loaded yet.',
  showContacts: 'Reveal contacts',
  hideContacts: 'Hide contacts',
  noContacts: 'Personal contacts are not published — message the hub on Instagram.',
  contactsRevealed: 'Contacts revealed:',
  weeklyTimetable: 'Weekly timetable',
  liveCalendar: 'Live calendar',
  noDayEvents: 'No events',
  activeBooking: 'Event',
  close: 'Close',
  timeTbd: 'time TBD',
  routeOnMap: 'Show route on map',
  routePlanner: 'Route planner',
  routeStart: 'Start',
  routeDest: 'Destination',
  hubNetwork: 'Regional hub network',
  hubMapTitle: 'Kazakhstan hubs map',
  hubsOnMap: 'Hubs on map',
  expandMap: 'Expand map',
  collapseMap: 'Collapse map',
  myLocation: 'My location',
  locating: 'Locating...',
  selectHub: 'Select hub',
  selectedHub: 'Selected hub',
  exactAddress: 'Exact address from local data',
  cityAddressFallback: 'City-level address: street was not found in local posts',
  routeDistance: 'Distance',
  meterUnit: 'm',
  kilometerUnit: 'km',
  open2gisRoute: 'Route in 2GIS',
  locationDenied: 'Browser location permission was denied.',
  locationUnsupported: 'Geolocation is unavailable in this browser.',
  locationError: 'Could not detect your location.',
  plottingRoute: 'Plotting route:',
  plottingInline: 'Plotting an interactive route inside the chat...',
  switchedHub: 'Active hub:',
  openedTeamDeck: 'Team opened!',
  agentRequestError: 'Agent request error',
  bioSource: "Data collected from the hub's Instagram.",
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

const DICTS: Record<Lang, Dict> = { ru, kk, en };

export function getDict(lang: Lang): Dict {
  return DICTS[lang] ?? ru;
}

const MONTHS: Record<Lang, string[]> = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  kk: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  ru: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  kk: ['жс', 'дс', 'сс', 'ср', 'бс', 'жм', 'сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/**
 * Localized display date for an ISO date, e.g. "сб, 14 июня" / "сб, 14 маусым"
 * / "Sat, 14 June". Built from explicit tables because the kk-KZ ICU data
 * renders short months as "М06".
 */
export function formatDay(isoDate: string, lang: Lang): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return `${WEEKDAYS_SHORT[lang][d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[lang][d.getUTCMonth()]}`;
}

// ---------------------------------------------------------------------------
// Data-driven strings: the parsed dataset stores cities, roles and template
// names in Russian; these helpers localize them for the KZ/EN interface.
// ---------------------------------------------------------------------------

const CITY_I18N: Record<string, { kk: string; en: string }> = {
  'Астана': { kk: 'Астана', en: 'Astana' },
  'Алматы': { kk: 'Алматы', en: 'Almaty' },
  'Тараз': { kk: 'Тараз', en: 'Taraz' },
  'Павлодар': { kk: 'Павлодар', en: 'Pavlodar' },
  'Жезказган': { kk: 'Жезқазған', en: 'Zhezkazgan' },
  'Кызылорда': { kk: 'Қызылорда', en: 'Kyzylorda' },
  'Туркестан': { kk: 'Түркістан', en: 'Turkistan' },
  'Уральск': { kk: 'Орал', en: 'Uralsk' },
  'Оскемен': { kk: 'Өскемен', en: 'Oskemen' },
  'Актобе': { kk: 'Ақтөбе', en: 'Aktobe' },
  'Актау': { kk: 'Ақтау', en: 'Aktau' },
  'Атырау': { kk: 'Атырау', en: 'Atyrau' },
  'Костанай': { kk: 'Қостанай', en: 'Kostanay' },
  'Кокшетау': { kk: 'Көкшетау', en: 'Kokshetau' },
  'Петропавловск': { kk: 'Петропавл', en: 'Petropavlovsk' },
  'Шымкент': { kk: 'Шымкент', en: 'Shymkent' },
  'Талдыкорган': { kk: 'Талдықорған', en: 'Taldykorgan' },
  'Семей': { kk: 'Семей', en: 'Semey' },
  'Алатау': { kk: 'Алатау', en: 'Alatau' },
};

export function localizeCity(city: string, lang: Lang): string {
  if (lang === 'ru') return city;
  return CITY_I18N[city]?.[lang] ?? city;
}

const ROLE_I18N: Record<string, { kk: string; en: string }> = {
  'Официальный аккаунт хаба': { kk: 'Хабтың ресми аккаунты', en: 'Official hub account' },
  'Директор': { kk: 'Директор', en: 'Director' },
  'Региональный менеджер': { kk: 'Аймақтық менеджер', en: 'Regional manager' },
  'Команда хаба': { kk: 'Хаб командасы', en: 'Hub team' },
};

export function localizeRole(role: string, lang: Lang): string {
  if (lang === 'ru') return role;
  return ROLE_I18N[role]?.[lang] ?? role;
}

/** Template names like "Команда Astana Hub" -> "Astana Hub командасы" / "Astana Hub team". */
export function localizeName(name: string, lang: Lang): string {
  const match = name.match(/^Команда\s+(.+)$/);
  if (!match) return name;
  if (lang === 'kk') return `${match[1]} командасы`;
  if (lang === 'en') return `${match[1]} team`;
  return name;
}

/** Localizes the ", Казахстан" country suffix in generated hub addresses. */
export function localizeAddress(address: string, lang: Lang): string {
  if (lang === 'kk') {
    return address
      .replace(/, Казахстан$/, ', Қазақстан')
      .replace(/(^|[,\s])г\.\s*/g, '$1')
      .replace(/(^|[,\s])пр\.\s*/g, '$1')
      .replace(/Мангилик Ел/g, 'Мәңгілік Ел')
      .replace(/Мәңгілік Ел(\s+\d)/g, 'Мәңгілік Ел даңғылы$1')
      .replace(/Туркестан/g, 'Түркістан')
      .replace(/Уральск/g, 'Орал')
      .replace(/Оскемен/g, 'Өскемен')
      .replace(/Актобе/g, 'Ақтөбе')
      .replace(/Кокшетау/g, 'Көкшетау')
      .replace(/Актау/g, 'Ақтау')
      .replace(/Кызылорда/g, 'Қызылорда')
      .replace(/Жезказган/g, 'Жезқазған')
      .replace(/Талдыкорган/g, 'Талдықорған')
      .replace(/Костанай/g, 'Қостанай');
  }
  if (lang === 'en') return address.replace(/, Казахстан$/, ', Kazakhstan');
  return address;
}
