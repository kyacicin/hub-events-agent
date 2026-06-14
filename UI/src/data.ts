export interface EventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: string; // Accelerator, Hackathon, Conference, Meetup, Pitch, Seminar
  format: 'ONLINE' | 'OFFLINE';
  venue: string;
  description: string;
  imageColor: string; // Tailwind gradient for beautiful cards
  instagramUrl?: string;
  likes: number;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatarColor: string;
}

export interface Hub {
  id: string; // e.g. astana, almaty, shymkent, karaganda, taraz
  name: string;
  city: string;
  region: string;
  address: string;
  telegram?: string;
  instagram?: string;
  coordinates: { x: number; y: number }; // SVG coordinates for Kz map
  workingHours: string;
  residentsCount: string;
  eventsCount: string;
  teamCount: string;
  team: TeamMember[];
  events: EventItem[];
  about: string;
}

export const HUBS_DATA: Hub[] = [
  {
    id: "astana",
    name: "Astana Hub",
    city: "Астана",
    region: "Акмолинская область",
    address: "пр. Мангилик Ел 55/8, павильон С1 EXPO, Астана",
    telegram: "astanahub",
    instagram: "astana.hub",
    coordinates: { x: 300, y: 155 },
    workingHours: "24/7 (для резидентов), 09:00 - 18:30 (офис)",
    residentsCount: "850+",
    eventsCount: "12",
    teamCount: "120+",
    about: "Крупнейший международный технопарк IT-стартапов в Центральной Азии. Astana Hub создает экосистему для развития отечественных и зарубежных технологических компаний.",
    team: [
      {
        name: "Магжан Мадиев",
        role: "Генеральный директор (CEO) Astana Hub",
        email: "m.madiev@astanahub.com",
        avatarColor: "from-teal-400 to-emerald-600"
      },
      {
        name: "Алина Ержанова",
        role: "Координатор региональных хабов",
        email: "a.erzhanova@astanahub.com",
        phone: "+7 (701) 456-78-90",
        avatarColor: "from-sky-400 to-indigo-600"
      },
      {
        name: "Данияр Каримов",
        role: "Главный комьюнити-менеджер",
        email: "d.karimov@astanahub.com",
        phone: "+7 (777) 123-45-67",
        avatarColor: "from-purple-400 to-pink-600"
      }
    ],
    events: [
      {
        id: "ast-1",
        title: "Astana Innovations Accelerator 2026",
        date: "пн, 15 июня",
        time: "15:00",
        type: "Акселератор",
        format: "ONLINE",
        venue: "Viber / Zoom, Экосистема Астаны",
        description: "Прием заявок в акселератор для способных IT-проектов, которые готовы внедрять умные решения в городскую инфраструктуру Астаны. Дедлайн подачи заявок — 20 июня. Программа акселерации длится 12 недель, включает трекинг, менторство и питчи перед акиматом.",
        imageColor: "from-teal-900/60 to-emerald-850/60",
        instagramUrl: "https://instagram.com/astana.hub",
        likes: 128
      },
      {
        id: "ast-2",
        title: "Startup Battle: AI Revolution",
        date: "пт, 19 июня",
        time: "18:30",
        type: "Баттл стартапов",
        format: "OFFLINE",
        venue: "Astana Hub, Event Hall (1 этаж)",
        description: "Легендарная битва стартапов, сфокусированная на ИИ-решениях. 10 лучших отобранных команд выступят перед инвесторами и экспертами рынка за призовой фонд в 2,500,000 тенге. Приходи поддержать участников или завести ценные знакомства на нетворкинге!",
        imageColor: "from-violet-900/60 to-indigo-850/60",
        instagramUrl: "https://instagram.com/astana.hub",
        likes: 95
      }
    ]
  },
  {
    id: "almaty",
    name: "Almaty IT Hub",
    city: "Алматы",
    region: "Алматинская область",
    address: "ул. Байтурсынова 22, Almaty Towers, Алматы",
    telegram: "almaty_it_hub",
    instagram: "almaty.hub",
    coordinates: { x: 370, y: 340 },
    workingHours: "09:00 - 21:00 (пн-сб)",
    residentsCount: "350+",
    eventsCount: "8",
    teamCount: "15",
    about: "Один из ведущих региональных хабов, сфокусированный на креативных индустриях, gamedev-секторе и разработке программного обеспечения для финтех-отрасли.",
    team: [
      {
        name: "Расул Мамытов",
        role: "Директор Almaty IT Hub",
        email: "r.mamytov@astanahub.com",
        avatarColor: "from-amber-400 to-orange-600"
      },
      {
        name: "Алия Смагулова",
        role: "Координатор акселерационных программ",
        email: "a.smagulova@astanahub.com",
        phone: "+7 (702) 111-22-33",
        avatarColor: "from-rose-400 to-red-600"
      }
    ],
    events: [
      {
        id: "alm-1",
        title: "Almaty DevFest 2026: Game & FinTech",
        date: "сб, 20 июня",
        time: "10:00",
        type: "Конференция",
        format: "OFFLINE",
        venue: "Almaty IT Hub Workspace, Секция А",
        description: "Крупнейшее техническое событие для разработчиков Алматы. В программе 3 параллельных трека докладов: Архитектура масштабных приложений, ИИ в продакшене и Game Development. Ожидаются спикеры из Google, Booking.com и ведущих IT-компаний KZ.",
        imageColor: "from-rose-900/60 to-red-850/60",
        instagramUrl: "https://instagram.com/almaty.hub",
        likes: 215
      }
    ]
  },
  {
    id: "shymkent",
    name: "Shymkent IT Hub",
    city: "Шымкент",
    region: "Туркестанская область",
    address: "пр. Тауке Хана 5, Шымкент",
    telegram: "shymkent_it_hub",
    instagram: "shymkent_it",
    coordinates: { x: 250, y: 350 },
    workingHours: "09:00 - 19:00 (пн-пт)",
    residentsCount: "120+",
    eventsCount: "5",
    teamCount: "8",
    about: "Технологический хаб на юге Казахстана, стимулирующий технологическое предпринимательство и цифровизацию агросферы, логистики и туризма региона.",
    team: [
      {
        name: "Баглан Нурланов",
        role: "Региональный директор хаба",
        email: "b.nurlanov@astanahub.com",
        avatarColor: "from-blue-400 to-cyan-600"
      },
      {
        name: "Жансая Умарова",
        role: "Менеджер образовательных программ",
        email: "zh.umarova@astanahub.com",
        phone: "+7 (775) 987-65-43",
        avatarColor: "from-emerald-400 to-teal-600"
      }
    ],
    events: [
      {
        id: "shym-1",
        title: "Shymkent AI Hackathon 2026",
        date: "пт, 26 июня",
        time: "14:00 (старт)",
        type: "Хакатон",
        format: "OFFLINE",
        venue: "Shymkent IT Hub, Главный Зал",
        description: "48-часовой интенсивный марафон по разработке технологических прототипов на базе Artificial Intelligence. Кейсы от ведущих компаний региона по автоматизации логистики, чат-ботов на казахском языке и умного туризма Шымкента.",
        imageColor: "from-cyan-900/60 to-blue-850/60",
        instagramUrl: "https://instagram.com/shymkent_it",
        likes: 184
      }
    ]
  },
  {
    id: "karaganda",
    name: "Terricon Valley",
    city: "Караганда",
    region: "Карагандинская область",
    address: "ул. Алалыкина 12, Караганда",
    telegram: "terricon_valley",
    instagram: "terricon.valley",
    coordinates: { x: 290, y: 200 },
    workingHours: "09:00 - 20:00 (пн-сб)",
    residentsCount: "210+",
    eventsCount: "6",
    teamCount: "18",
    about: "Инновационная экосистема Карагандинской области. Построена на базе легендарного промышленного региона для превращения его в новую цифровую столицу с мощным ИТ и дизайн комьюнити.",
    team: [
      {
        name: "Александр Дорошенко",
        role: "Основатель Terricon Valley & Координатор",
        email: "a.doroshenko@astanahub.com",
        avatarColor: "from-amber-500 to-yellow-600"
      },
      {
        name: "Мария Волкова",
        role: "Event-директор Terricon Valley",
        email: "m.volkova@astanahub.com",
        phone: "+7 (707) 333-44-55",
        avatarColor: "from-fuchsia-400 to-purple-600"
      }
    ],
    events: [
      {
        id: "kar-1",
        title: "Karaganda IT Meetup (Карьера в IT)",
        date: "чт, 18 июня",
        time: "19:00",
        type: "Митап",
        format: "OFFLINE",
        venue: "Terricon Valley Coworking, лекторий 'Уголь'",
        description: "Встреча местных ИТ-инженеров и экспертов региона. Специальный гость поделится опытом релокации и удаленной работы в США. Обсудим текущий рынок труда, зарплаты и ключевые навыки, которые востребованы в 2026 году.",
        imageColor: "from-orange-900/60 to-amber-850/60",
        instagramUrl: "https://instagram.com/terricon.valley",
        likes: 67
      }
    ]
  },
  {
    id: "taraz",
    name: "Taraz IT Hub",
    city: "Тараз",
    region: "Жамбылская область",
    address: "ул. Толе би 55, Тараз",
    telegram: "taraz_it_hub",
    instagram: "taraz.it",
    coordinates: { x: 210, y: 310 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "75+",
    eventsCount: "3",
    teamCount: "5",
    about: "Региональный хаб, направленный на обучение молодежи программированию, робототехнике, 3D-моделированию, а также создание пула технологических специалистов на юге страны.",
    team: [
      {
        name: "Ерлан Сырдыбаев",
        role: "Координатор Taraz IT Hub",
        email: "e.syrdybaev@astanahub.com",
        avatarColor: "from-pink-400 to-rose-600"
      },
      {
        name: "Нурдаулет Оспанов",
        role: "Ментор курса Tech Orda",
        email: "n.ospanov@astanahub.com",
        phone: "+7 (705) 555-11-22",
        avatarColor: "from-yellow-400 to-orange-500"
      }
    ],
    events: [
      {
        id: "tar-1",
        title: "IT Jump Taraz Bootcamp",
        date: "пн, 22 июня",
        time: "14:00 (старт)",
        type: "Обучение",
        format: "ONLINE",
        venue: "Taraz IT Hub, TarSU Campus / Discord-сервер",
        description: "Презентация и первый запуск интенсивного двухмесячного ИТ-буткампа для жамбылской молодежи. Научим верстать современные сайты и создавать серверную часть на TypeScript. Предоставляется шанс получить грант Tech Orda!",
        imageColor: "from-pink-900/60 to-rose-850/60",
        instagramUrl: "https://instagram.com/taraz.it",
        likes: 112
      }
    ]
  },
  {
    id: "pavlodar",
    name: "Pavlodar Hub",
    city: "Павлодар",
    region: "Павлодарская область",
    address: "ул. Ломова 64, Павлодар",
    telegram: "pavlodar_hub",
    instagram: "pavlodar.hub",
    coordinates: { x: 340, y: 140 },
    workingHours: "09:00 - 19:00 (пн-пт)",
    residentsCount: "90+",
    eventsCount: "2",
    teamCount: "4",
    about: "Региональный IT-хаб Павлодарской области на базе Toraighyrov University. Сфокусирован на подготовке инженерных кадров, промышленной автоматизации и синергии вузов и производства.",
    team: [{ name: "Арман Бакитов", role: "Координатор Pavlodar Hub", email: "a.bakitov@astanahub.com", avatarColor: "from-blue-500 to-indigo-600" }],
    events: [{ id: "pav-1", title: "Pavlodar IoT & Smart Grid Hackathon", date: "ср, 24 июня", time: "11:00", type: "Хакатон", format: "OFFLINE", venue: "Pavlodar Hub Coworking", description: "Инженерный хакатон по автоматизации сетей и IoT-решениям для умных городов Казахстана. Победители получат менторскую поддержку и право пилотирования на базе предприятий города.", imageColor: "from-teal-900 to-emerald-800", likes: 45 }]
  },
  {
    id: "aktobe",
    name: "Aktobe IT Hub",
    city: "Актобе",
    region: "Актюбинская область",
    address: "пр. Абилкайыр хана 51, Актобе",
    telegram: "aktobe_it_hub",
    instagram: "aktobe.it",
    coordinates: { x: 120, y: 220 },
    workingHours: "09:00 - 18:30 (пн-пт)",
    residentsCount: "110+",
    eventsCount: "3",
    teamCount: "6",
    about: "Инновационный центр Актюбинской области. Занимается популяризацией технологического предпринимательства, обучением детей разработке игр и помощью в оцифровке бизнеса.",
    team: [{ name: "Олжас Смагулов", role: "Региональный координатор", email: "o.smagulov@astanahub.com", avatarColor: "from-amber-400 to-red-600" }],
    events: [{ id: "akt-1", title: "Aktobe Tech Day: Startup Pitch", date: "вт, 23 июня", time: "16:00", type: "Питч-сессия", format: "OFFLINE", venue: "Aktobe IT Hub Event Hall", description: "Открытая питч-сессия местных стартапов перед инвесторами и бизнес-ангелами Западного Казахстана. Получите детальный разбор вашего продукта от опытных экспертов РК.", imageColor: "from-purple-900 to-rose-850", likes: 54 }]
  },
  {
    id: "uralsk",
    name: "Jaiyq Hub",
    city: "Уральск",
    region: "Западно-Казахстанская область",
    address: "ул. Сарайшык 28, Уральск",
    telegram: "jaiyq_hub",
    instagram: "jaiyq.hub",
    coordinates: { x: 50, y: 170 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "65+",
    eventsCount: "1",
    teamCount: "4",
    about: "Технопарк Приуралья. Развивает зеленые технологии, агро-стартапы, а также цифровые сервисы для трансграничной торговли и логистики.",
    team: [{ name: "Арсен Тлеубаев", role: "Координатор Jaiyq Hub", email: "a.tleubaev@astanahub.com", avatarColor: "from-emerald-400 to-teal-600" }],
    events: [{ id: "ura-1", title: "GreenTech West Kazakhstan Webinar", date: "чт, 25 июня", time: "15:00", type: "Вебинар", format: "ONLINE", venue: "Zoom конференция", description: "Онлайн-семинар, посвященный внедрению экологически чистых решений и IoT-технологий в современное сельское хозяйство и оптимизацию экологии Западного региона.", imageColor: "from-emerald-900 to-emerald-800", likes: 21 }]
  },
  {
    id: "kyzylorda",
    name: "Kyzylorda Hub",
    city: "Кызылорда",
    region: "Кызылординская область",
    address: "ул. Абая 24, Кызылорда",
    telegram: "kyzylorda_hub",
    instagram: "kyzylorda.hub",
    coordinates: { x: 190, y: 290 },
    workingHours: "09:00 - 19:00 (пн-пт)",
    residentsCount: "70+",
    eventsCount: "2",
    teamCount: "5",
    about: "Региональный IT-кластер Приаралья. Сфокусирован на вовлечении молодежи в спортивное программирование, веб-разработку и подготовку кадров к цифровизации региона.",
    team: [{ name: "Султан Касымов", role: "Руководитель Kyzylorda Hub", email: "s.kasymov@astanahub.com", avatarColor: "from-pink-400 to-rose-600" }],
    events: [{ id: "kyz-1", title: "Kyzylorda CodeFest: Junior Devs", date: "сб, 27 июня", time: "11:00", type: "Конкурс", format: "OFFLINE", venue: "IT Space", description: "Хакатон для начинающих frontend и backend разработчиков Кызылорды. Создайте прототип полезного сервиса для жителей города всего за сутки и заберите ценные призы!", imageColor: "from-sky-900 to-blue-850", likes: 31 }]
  },
  {
    id: "kokshetau",
    name: "Aqmola IT Hub",
    city: "Кокшетау",
    region: "Акмолинская область",
    address: "ул. Акана серэ 90, Кокшетау",
    telegram: "aqmola_it",
    instagram: "aqmolait",
    coordinates: { x: 270, y: 130 },
    workingHours: "09:00 - 18:30 (пн-пт)",
    residentsCount: "55+",
    eventsCount: "1",
    teamCount: "3",
    about: "Акмолинский ИТ-хаб, развивающий туристические стартапы (TravelTech), экологические платформы и цифровые инициативы для курортной зоны Бурабай.",
    team: [{ name: "Амирхан Сабитов", role: "Координатор Aqmola IT Hub", email: "a.sabitov@astanahub.com", avatarColor: "from-cyan-400 to-blue-600" }],
    events: [{ id: "aqm-1", title: "TravelTech Akmola Forum", date: "ср, 17 июня", time: "14:30", type: "Форум", format: "OFFLINE", venue: "Aqmola IT Hub, Конференц-зал", description: "Обсуждение внедрения современных цифровых решений в сферу туризма Акмолинской области. Презентация стартап-идей перед представителями отелей и курортов Бурабай.", imageColor: "from-sky-900 to-cyan-800", likes: 19 }]
  },
  {
    id: "kostanay",
    name: "Kostanay IT Hub",
    city: "Костанай",
    region: "Костанайская область",
    address: "ул. Амангельды 93, Костанай",
    telegram: "kostanay_it",
    instagram: "kostanay.it",
    coordinates: { x: 210, y: 120 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "80+",
    eventsCount: "2",
    teamCount: "4",
    about: "Технологический форпост Костанайщины, специализирующийся на решениях AgroTech, оптимизации производственных цепочек элеваторов и крупных агрохолдингов Казахстана.",
    team: [{ name: "Берик Назаров", role: "Dir Kostanay Hub", email: "b.nazarov@astanahub.com", avatarColor: "from-lime-400 to-green-600" }],
    events: [{ id: "kos-1", title: "AgroTech Innovators Meetup", date: "пт, 26 июня", time: "16:00", type: "Митап", format: "OFFLINE", venue: "Kostanay IT Hub Coworking", description: "Встреча разработчиков и экспертов сельского хозяйства. Рассматриваем реальные кейсы применения искусственного интеллекта и датчиков влажности на полях региона.", imageColor: "from-amber-900 to-emerald-800", likes: 42 }]
  },
  {
    id: "petropavl",
    name: "Qyzyljar Hub",
    city: "Петропавловск",
    region: "Северо-Казахстанская область",
    address: "ул. Пушкина 86, Петропавловск",
    telegram: "qyzyljar_hub",
    instagram: "qyzyljar.it",
    coordinates: { x: 290, y: 90 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "60+",
    eventsCount: "1",
    teamCount: "3",
    about: "Северный инновационный хаб. Способствует трансграничной интеграции, обучению молодежи робототехнике, интернету вещей и программированию (Tech Orda).",
    team: [{ name: "Валерий Ким", role: "Координатор Qyzyljar Hub", email: "v.kim@astanahub.com", avatarColor: "from-teal-400 to-indigo-600" }],
    events: [{ id: "pet-1", title: "Web development Bootcamp Pitch", date: "вт, 30 июня", time: "14:00", type: "Демо-день", format: "ONLINE", venue: "Qyzyljar Hub Discord", description: "Финальная защита выпускных ИТ-проектов студентами в рамках весенней программы буткампа. Темы проектов варьируются от сервисов доставки в СКО до ИИ-ботов в Telegram.", imageColor: "from-violet-900 to-fuchsia-850", likes: 25 }]
  },
  {
    id: "ust_kamenogorsk",
    name: "Oskemen IT Hub",
    city: "Усть-Каменогорск",
    region: "Восточно-Казахстанская область",
    address: "ул. Протозанова 83, Усть-Каменогорск",
    telegram: "oskemen_it",
    instagram: "oskemen.hub",
    coordinates: { x: 380, y: 220 },
    workingHours: "09:00 - 19:00 (пн-пт)",
    residentsCount: "95+",
    eventsCount: "3",
    teamCount: "5",
    about: "Хаб в Рудном Алтае, нацеленный на инновации в металлургии, промышленной робототехнике, приборостроении, и экологической безопасности крупных промышленных центров.",
    team: [{ name: "Дамир Сериков", role: "Координатор Oskemen IT", email: "d.serikov@astanahub.com", avatarColor: "from-indigo-400 to-purple-600" }],
    events: [{ id: "osk-1", title: "Ecology & Metallurgy Smart AI Hack", date: "сб, 20 июня", time: "09:00", type: "Хакатон", format: "OFFLINE", venue: "IT-полигон", description: "Разработка алгоритмов машинного обучения для интеллектуального анализа выбросов и автоматизации производств. Призовой фонд 1,000,000 тг от градообразующих предприятий.", imageColor: "from-slate-900 to-zinc-850", likes: 62 }]
  },
  {
    id: "semey",
    name: "Abai IT Hub",
    city: "Семей",
    region: "Область Абай",
    address: "ул. Ленина 4, Семей",
    telegram: "abai_it_hub",
    instagram: "abai.it",
    coordinates: { x: 350, y: 195 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "70+",
    eventsCount: "2",
    teamCount: "4",
    about: "Историко-культурный технологический центр. Направлен на развитие креативных индустрий, цифровые гуманитарные науки, создание казахскоязычного контента и EdTech систем.",
    team: [{ name: "Жасулан Ахметов", role: "Координатор Abai IT Hub", email: "zh.akhmetov@astanahub.com", avatarColor: "from-rose-400 to-amber-600" }],
    events: [{ id: "sem-1", title: "Creative Industry Startup Meetup", date: "вт, 16 июня", time: "15:00", type: "Митап", format: "OFFLINE", venue: "Abai IT Hub, Лекторий", description: "Обсуждение возможностей финансирования креативных проектов, медиа-платформ и ИТ-решений в искусстве. Делимся секретами продвижения локального контента в СНГ.", imageColor: "from-pink-900 to-red-850", likes: 38 }]
  },
  {
    id: "aktau",
    name: "Mangystau Hub",
    city: "Актау",
    region: "Мангистауская область",
    address: "14-й микрорайон, зд. 50, Актау",
    telegram: "mangystau_hub",
    instagram: "mangystau.hub",
    coordinates: { x: 80, y: 310 },
    workingHours: "09:00 - 18:30 (пн-пт)",
    residentsCount: "85+",
    eventsCount: "2",
    teamCount: "4",
    about: "Каспийский хаб инноваций, сфокусированный на цифровизации морского порта, портовой логистике, опреснении воды и внедрении систем возобновляемой энергетики.",
    team: [{ name: "Нурсултан Маратов", role: "Региональный директор", email: "n.maratov@astanahub.com", avatarColor: "from-cyan-400 to-sky-600" }],
    events: [{ id: "akt-m1", title: "Maritime & Logistics Digital Forum", date: "ср, 24 июня", time: "10:30", type: "Форум", format: "OFFLINE", venue: "Mangystau Hub, Event Hall", description: "Презентация и пилотирование ИТ-сервисов по оптимизации контейнерных перевозок через Каспий. Участие принимают судоходные и логистические компании Запада РК.", imageColor: "from-sky-900 to-blue-850", likes: 51 }]
  },
  {
    id: "atyrau",
    name: "Atyrau Hub",
    city: "Атырау",
    region: "Атырауская область",
    address: "ул. Студенческая 1, Атырау",
    telegram: "atyrau_hub",
    instagram: "atyrau.it",
    coordinates: { x: 90, y: 250 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "105+",
    eventsCount: "2",
    teamCount: "5",
    about: "Нефтяная цифровая столица Казахстана. Направлен на разработку решений OilTech, промышленную безопасность, автоматизацию бурения и экологический мониторинг.",
    team: [{ name: "Кайрат Утепов", role: "Координатор Atyrau Hub", email: "k.utepov@astanahub.com", avatarColor: "from-amber-400 to-yellow-600" }],
    events: [{ id: "aty-1", title: "OilTech Smart Startup Hackathon", date: "пт, 26 июня", time: "15:00", type: "Хакатон", format: "OFFLINE", venue: "Atyrau Hub, Event Space", description: "ИТ-хакатон с рекордным призовым фондом в 3,000,000 тенге за лучшие программные инструменты для безопасности на месторождениях и прогнозирования работы оборудования.", imageColor: "from-zinc-900 to-neutral-800", likes: 88 }]
  },
  {
    id: "zhezkazgan",
    name: "Ulytau IT Hub",
    city: "Жезказган",
    region: "Улытауская область",
    address: "ул. Абая 12, Жезказган",
    telegram: "ulytau_it",
    coordinates: { x: 230, y: 230 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "45+",
    eventsCount: "1",
    teamCount: "3",
    about: "Развивающийся инновационный центр в сердце Казахстана, содействующий цифровизации горнодобывающей промышленности региона, развитию EdTech и ИТ-школ для детей.",
    team: [{ name: "Асет Муканов", role: "Координатор Ulytau IT Hub", email: "a.mukanov@astanahub.com", avatarColor: "from-red-500 to-orange-600" }],
    events: [{ id: "uly-1", title: "Ulytau EdTech & Coding Seminar", date: "вт, 30 июня", time: "11:00", type: "Семинар", format: "ONLINE", venue: "Zoom вебинар", description: "Информационная сессия для учителей и школьников Улытауской области о современных ИТ-кружках, грантах Astana Hub и возможностях легкого старта в программировании с нуля.", imageColor: "from-orange-900 to-red-850", likes: 16 }]
  },
  {
    id: "konaev",
    name: "Konaev IT Hub",
    city: "Конаев",
    region: "Алматинская область",
    address: "микрорайон 1, зд. 38, Конаев",
    telegram: "konaev_it",
    coordinates: { x: 340, y: 310 },
    workingHours: "09:00 - 18:30 (пн-пт)",
    residentsCount: "50+",
    eventsCount: "1",
    teamCount: "3",
    about: "Специализируется на решениях в сфере развлечений, цифрового туризма близ Капшагайского водохранилища, умных карт регионов и систем автоматизации малого бизнеса.",
    team: [{ name: "Тимур Рахимов", role: "Координатор Konaev IT Hub", email: "t.rakhimov@astanahub.com", avatarColor: "from-blue-400 to-sky-600" }],
    events: [{ id: "kon-1", title: "Smart City Konaev: Digital Map Idea Session", date: "вт, 23 июня", time: "16:00", type: "Воркшоп", format: "OFFLINE", venue: "Konaev IT Hub Lounge", description: "Проектирование интерактивных цифровых карт для туристов Конаева и экосистемы развлечений. Лучшие идеи получат финансирование на разработку прототипов.", imageColor: "from-cyan-900 to-indigo-850", likes: 24 }]
  },
  {
    id: "taldykorgan",
    name: "Zhetysu IT Hub",
    city: "Талдыкорган",
    region: "Жетысуская область",
    address: "ул. Тауелсыздык 91, Талдыкорган",
    telegram: "zhetysu_it",
    coordinates: { x: 360, y: 280 },
    workingHours: "09:00 - 18:00 (пн-пт)",
    residentsCount: "60+",
    eventsCount: "1",
    teamCount: "3",
    about: "Жетысуский региональный хаб, продвигающий технологии умного агропроизводства, оцифровку эко-туризма (Шымбулак, Кольсай, Чарын) и образовательные ИТ-продукты.",
    team: [{ name: "Саят Калиев", role: "Координатор Zhetysu Hub", email: "s.kaliev@astanahub.com", avatarColor: "from-green-400 to-emerald-600" }],
    events: [{ id: "zhe-1", title: "EcoTech & Agriculture Innovation Workshop", date: "чт, 18 июня", time: "15:00", type: "Воркшоп", format: "OFFLINE", venue: "Zhetysu IT Hub, Лекторий", description: "Практический семинар по разработке датчиков полива и дронов-мониторинга для крестьянских хозяйств Жетысу и автоматизации работы тепличных комплексов.", imageColor: "from-emerald-900 to-green-800", likes: 29 }]
  }
];

export const GENERAL_FAQ = [
  {
    question: "Какая польза от региональных хабов для стартапов?",
    answer: "Региональные хабы предоставляют бесплатные коворкинги, бесплатные образовательные программы, помощь в подаче заявок на финансирование (программа Tech Orda софинансирует обучение до 600,000 тг), консультации по налоговым льготам Astana Hub и сильное окружение единомышленников."
  },
  {
    question: "Как стать резидентом Astana Hub?",
    answer: "Стать резидентом могут юридические лица (ТОО), соответствующие ИТ-видам деятельности (ОКЭД). Подача заявки происходит онлайн на портале astanahub.com. Резиденты освобождаются от большинства налогов (КПН, ИПН, НДС, социального налога) и могут привлекать иностранных специалистов на упрощенных условиях."
  },
  {
    question: "Что за программа Tech Orda?",
    answer: "Tech Orda — это программа субсидирования обучения IT-специальностям от Министерства цифрового развития Республики Казахстан и Astana Hub. Гражданам РК в возрасте от 18 до 35 лет предоставляются гранты на обучение до 600,000 тенге в ведущих частных IT-школах республики."
  }
];
