# Hub Events Agent 

> AI-агент для поиска мероприятий региональных хабов Astana Hub по всему Казахстану

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://hub-events-agent.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Что это такое

Hub Events Agent — чат-интерфейс, который отвечает на вопросы о предстоящих мероприятиях и командах региональных хабов Astana Hub. Пользователь пишет свой город — агент мгновенно выдаёт актуальные события и контакты сотрудников.

**Пример диалога:**

```
Пользователь: Привет, я из Тараза. Что есть в ближайшее время?

Агент: Нашёл 2 мероприятия от Zhambyl Hub:

[ОФЛАЙН] Demo Day: предынкубация
14 июня · 14:00 · ул. Толе би 58, зал 201
Финальные презентации стартапов первого потока.

[ОНЛАЙН] Cursor AI воркшоп
20 июня · 11:00 · Zoom — ссылка в @zhambyl_hub

Пользователь: А кто директор хаба?

Агент:
Команда Zhambyl Hub:
— Азиз Сейткали · Директор · @aziz_hub
— Мария Алибекова · Региональный менеджер
```

---

## Архитектура

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                │
│  ┌──────────────┐   ┌──────────────────────────────┐│
│  │  Chat UI     │   │    Event Cards Component      ││
│  │  (React)     │   │    (Название/Дата/Формат/     ││
│  │              │   │     Адрес/Детали)              ││
│  └──────┬───────┘   └──────────────────────────────┘│
└─────────┼───────────────────────────────────────────┘
          │ API запрос
┌─────────▼───────────────────────────────────────────┐
│                 BACKEND (Next.js API Routes)         │
│  ┌──────────────────────────────────────────────┐   │
│  │              AI Agent (Gemini API)           │   │
│  │  • Понимает свободный текст                  │   │
│  │  • Определяет регион пользователя            │   │
│  │  • Фильтрует события по городу               │   │
│  │  • Отвечает на вопросы о команде             │   │
│  └──────────────────────────────────────────────┘   │
└─────────┬───────────────────┬───────────────────────┘
          │                   │
┌─────────▼────────┐  ┌───────▼──────────────────────┐
│   DATA LAYER     │  │       SCRAPER (Apify)         │
│   (JSON / DB)    │  │  • Instagram парсинг          │
│                  │  │  • Local/manual refresh        │
│  events.json     │  │  • Извлечение постов,          │
│  staff.json      │  │    highlights, контактов       │
└──────────────────┘  └──────────────────────────────┘
```

### Слои системы

| Слой | Технология | Назначение |
|------|-----------|-----------|
| Frontend | Next.js + React + Tailwind | Чат-интерфейс, карточки событий |
| AI Agent | Gemini API (`gemini-3.5-flash`) | Понимание запросов, региональная фильтрация |
| Парсер | Apify Instagram Scraper | Сбор постов из Instagram-аккаунтов хабов |
| Хранилище | JSON-файлы; KV/DB для production refresh | Данные о событиях и сотрудниках |
| Хостинг | Vercel | Деплой приложения |

---

## Структура проекта

```
hub-events-agent/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Главная страница (чат)
│   │   └── api/
│   │       ├── chat/route.ts  # AI агент endpoint
│   │       └── scrape/route.ts # Ручной запуск парсера
│   ├── components/
│   │   ├── ChatInterface.tsx # Чат UI
│   │   └── EventCard.tsx     # Карточка события
│   └── lib/
│       ├── hubAccounts.ts    # Instagram-аккаунты хабов
│       ├── schemas.ts        # Схемы events.json и staff.json
│       ├── agent.ts          # Логика AI агента
│       ├── gemini.ts         # Gemini API client helper
│       ├── scraper.ts        # Apify интеграция
│       └── filter.ts         # Фильтрация по региону
├── data/
│   ├── events.json           # Seed/base событий
│   └── staff.json            # База сотрудников хабов
├── scripts/
│   ├── scrape.ts             # Скрипт парсинга (Apify + Gemini)
│   └── process.ts            # Обработка data/raw_posts.json через Gemini
├── AGENTS.md                 # Документация агента
└── README.md
```

---

## Источники данных

Парсятся Instagram-страницы региональных хабов:

| Хаб | Instagram page | Город |
|-----|----------------|-------|
| Turkistan Hub | [@turkistan.hub](https://www.instagram.com/turkistan.hub/) | Туркестан |
| Batys Hub | [@batys.hub](https://www.instagram.com/batys.hub/) | Уральск |
| Astana Hub | [@astana.hub](https://www.instagram.com/astana.hub/) | Астана |
| Almaty Hub | [@almaty_hub](https://www.instagram.com/almaty_hub/) | Алматы |
| Zhambyl Hub | [@zhambyl_hub](https://www.instagram.com/zhambyl_hub/) | Тараз |
| Alatau Hub | [@alatau.hub](https://www.instagram.com/alatau.hub/) | Алатау |
| Atyrau Hub | [@atyrau_it_hub](https://www.instagram.com/atyrau_it_hub/) | Атырау |
| Shymkent Hub | [@shymkent__hub](https://www.instagram.com/shymkent__hub/) | Шымкент |
| Qostanai Hub | [@qostanai.hub](https://www.instagram.com/qostanai.hub/) | Костанай |
| Pavlodar Hub | [@pavlodar.hub](https://www.instagram.com/pavlodar.hub/) | Павлодар |
| Oskemen Hub | [@oskemen.hub](https://www.instagram.com/oskemen.hub/) | Оскемен |
| Aqtobe Hub | [@aqtobe.hub](https://www.instagram.com/aqtobe.hub/) | Актобе |
| Aqmola Hub | [@aqmola.hub](https://www.instagram.com/aqmola.hub/) | Кокшетау |
| Mangystau Hub | [@mangystau.hub](https://www.instagram.com/mangystau.hub/) | Актау |
| Kyzylorda Hub | [@kyzylordahub](https://www.instagram.com/kyzylordahub/) | Кызылорда |
| Ulytau Hub | [@ulytau.hub](https://www.instagram.com/ulytau.hub/) | Жезказган |
| SKO Hub | [@sko_hub](https://www.instagram.com/sko_hub/) | Петропавловск |
| Jetisu Digital | [@jetisu_digital](https://www.instagram.com/jetisu_digital/) | Талдыкорган |
| Semey Hub | [@semey.hub](https://www.instagram.com/semey.hub/) | Семей |

Из каждого поста извлекается:
-  Дата и время события
-  Описание и детали
-  Хэштеги
-  Адрес (если указан)
-  Формат: офлайн / онлайн 

---

## Запуск локально

```bash
# 1. Клонируй репозиторий
git clone https://github.com/kyacicin/hub-events-agent.git
cd hub-events-agent

# 2. Установи зависимости
npm install

# 3. Настрой переменные окружения
cp .env.example .env.local
```

Заполни `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
APIFY_API_TOKEN=your_apify_token
GEMINI_MODEL=gemini-3.5-flash
APIFY_INSTAGRAM_ACTOR_ID=apify/instagram-scraper
APIFY_RESULTS_LIMIT=5
APIFY_ONLY_POSTS_NEWER_THAN=30 days
PROCESS_LIMIT=
SCRAPE_SECRET=your_scrape_secret
```

```bash
# 4. Запусти полный парсер (Apify + Gemini, соберёт данные в data/)
npm run scrape

# Если raw posts уже сохранены в data/raw_posts.json,
# можно отдельно прогнать только AI-обработку постов
npm run process:posts

# Для короткой проверки без обработки всей базы
PROCESS_LIMIT=5 npm run process:posts

# 5. Проверь код
npm test
npm run lint
npm run build

# 6. Запусти dev-сервер
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

---

## Деплой на Vercel

```bash
# Установи Vercel CLI
npm i -g vercel

# Деплой
vercel

# Добавь env переменные в Vercel Dashboard:
# GEMINI_API_KEY
```

На локальной машине `npm run scrape` записывает результат в:
- `data/events.json`
- `data/staff.json`

`POST /api/scrape` предназначен для защищённого локального/manual запуска и требует заголовок `x-scrape-secret` со значением `SCRAPE_SECRET`. На Vercel endpoint возвращает `501`, пока не подключено durable-хранилище: filesystem serverless-функций не является постоянным хранилищем, а статические импорты `data/*.json` не увидят новые данные без редеплоя.

Для настоящего production auto-refresh нужно добавить KV/Postgres/Blob storage, писать туда результат Apify+Gemini и читать events/staff в runtime.

---

## Data layer

- `src/lib/schemas.ts` задаёт TypeScript-типы и JSON Schema-like описания для `data/events.json` и `data/staff.json`.
- `src/lib/filter.ts` нормализует город или регион, сопоставляет город с region key и фильтрует события по дате.
- `src/lib/scraper.ts` является единым источником логики Apify/Gemini extraction; `npm run scrape`, `/api/scrape` и `npm run process:posts` переиспользуют его.
- `data/events.json` содержит demo seed из реальных Instagram-постов нескольких hub-аккаунтов. В seed есть будущие и одна прошедшая запись, чтобы проверить отсечение старых событий.
- `data/staff.json` содержит demo contact-записи по реальным hub Instagram-профилям без выдуманных имён сотрудников.

Пример фильтрации:

```ts
import events from "../data/events.json";
import { filterEvents } from "@/lib/filter";
import type { HubEvent } from "@/lib/schemas";

const tarazEvents = filterEvents(events as HubEvent[], {
  city: "Тараз",
  today: "2026-06-09",
});
```

---

## Chat API and UI

- `POST /api/chat` принимает `message` или историю `messages`, загружает `data/events.json` и `data/staff.json`, определяет регион из текста, фильтрует данные и вызывает Gemini API.
- `src/lib/agent.ts` собирает system prompt с релевантными `EVENTS_JSON`, `STAFF_JSON` и текущей датой. Ответ выбирает русский или казахский язык по последнему сообщению пользователя.
- Если Gemini API временно недоступен, route возвращает локальный fallback по тем же отфильтрованным данным, чтобы UI оставался тестируемым.
- `src/components/ChatInterface.tsx` отображает message bubbles и передаёт структурированные события в `EventCard`.

---

## Возможности агента

-  **Региональный фильтр** — понимает город из свободного текста («я из Тараза», «Алматы», «шымкент»)
-  **Актуальные события** — только предстоящие мероприятия, отсортированные по дате
-  **Команда хаба** — директора, менеджеры, контакты («кто директор?», «с кем по обучению?»)
-  **Карточки событий** — структурированный вывод с форматом, адресом, временем
-  **Обновление данных** — локальный/manual Apify+Gemini refresh; production auto-refresh требует durable storage
-  **Двуязычность** — интерфейс и ответы на русском и казахском языках

---

## Стек технологий

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **AI:** Gemini API (`gemini-3.5-flash`)
- **Парсер:** Apify Instagram Scraper
- **Хостинг:** Vercel
- **Данные:** JSON-файлы (events.json, staff.json)

---

## Лицензия

MIT © 2025 Hub Events Agent
