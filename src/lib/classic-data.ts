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
  imageUrl?: string;
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
  lat?: number;
  lng?: number;
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
