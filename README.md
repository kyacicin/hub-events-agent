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
│  │              AI Agent (Claude API)           │   │
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
│                  │  │  • Расписание (cron)           │
│  events.json     │  │  • Извлечение постов,          │
│  staff.json      │  │    highlights, контактов       │
└──────────────────┘  └──────────────────────────────┘
```

### Слои системы

| Слой | Технология | Назначение |
|------|-----------|-----------|
| Frontend | Next.js + React + Tailwind | Чат-интерфейс, карточки событий |
| AI Agent | Claude API (claude-sonnet-4) | Понимание запросов, региональная фильтрация |
| Парсер | Apify Instagram Scraper | Сбор постов из Instagram-аккаунтов хабов |
| Хранилище | JSON-файлы / Vercel KV | Данные о событиях и сотрудниках |
| Хостинг | Vercel | Деплой + cron jobs для обновления данных |

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
│   │   ├── EventCard.tsx     # Карточка события
│   │   └── StaffCard.tsx     # Карточка сотрудника
│   └── lib/
│       ├── hubAccounts.ts    # Instagram-аккаунты хабов
│       ├── agent.ts          # Логика AI агента
│       ├── scraper.ts        # Apify интеграция
│       └── filter.ts         # Фильтрация по региону
├── data/
│   ├── events.json           # База событий (обновляется cron)
│   └── staff.json            # База сотрудников хабов
├── scripts/
│   └── scrape.ts             # Скрипт парсинга (запускается по cron)
├── vercel.json               # Cron конфигурация
├── AGENTS.md                 # Документация агента
└── README.md
```

---

## Источники данных

Парсятся Instagram-аккаунты региональных хабов:

| Хаб | Instagram | Город |
|-----|-----------|-------|
| Turkistan Hub | @turkistan.hub | Туркестан |
| Batys Hub | @batys.hub | Уральск |
| Almaty Hub | @almaty_hub | Алматы |
| Zhambyl Hub | @zhambyl_hub | Тараз |
| Alatau Hub | @alatau.hub | Алатау |
| Atyrau Hub | @atyrau_it_hub | Атырау |
| Shymkent Hub | @shymkent__hub | Шымкент |
| Qostanai Hub | @qostanai.hub | Костанай |
| Pavlodar Hub | @pavlodar.hub | Павлодар |
| Oskemen Hub | @oskemen.hub | Оскемен |
| Aqtobe Hub | @aqtobe.hub | Актобе |
| Aqmola Hub | @aqmola.hub | Кокшетау |
| Mangystau Hub | @mangystau.hub | Актау |
| Kyzylorda Hub | @kyzylordahub | Кызылорда |
| Ulytau Hub | @ulytau.hub | Жезказган |
| SKO Hub | @sko_hub | Петропавловск |
| Jetisu Digital | @jetisu_digital | Талдыкорган |
| Semey Hub | @semey.hub | Семей |

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
ANTHROPIC_API_KEY=your_anthropic_api_key
APIFY_API_TOKEN=your_apify_token
```

```bash
# 4. Запусти парсер (соберёт данные в data/)
npm run scrape

# 5. Запусти dev-сервер
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
# ANTHROPIC_API_KEY, APIFY_API_TOKEN
```

Cron-задача для авто-обновления настраивается в `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 9 * * *"
    }
  ]
}
```
Парсер запускается каждый день в 09:00 UTC.

---

## Возможности агента

-  **Региональный фильтр** — понимает город из свободного текста («я из Тараза», «Алматы», «шымкент»)
-  **Актуальные события** — только предстоящие мероприятия, отсортированные по дате
-  **Команда хаба** — директора, менеджеры, контакты («кто директор?», «с кем по обучению?»)
-  **Карточки событий** — структурированный вывод с форматом, адресом, временем
-  **Авто-обновление** — данные обновляются ежедневно через cron
-  **Двуязычность** — интерфейс и ответы на русском и казахском языках

---

## Стек технологий

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Парсер:** Apify Instagram Scraper
- **Хостинг:** Vercel (с cron jobs)
- **Данные:** JSON-файлы (events.json, staff.json)

---

## Лицензия

MIT © 2025 Hub Events Agent
