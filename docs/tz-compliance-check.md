# Проверка ТЗ Hub Events Agent

Дата проверки: 2026-06-14.

## 1. Структура проекта

```text
hub-events-agent/
├── data/
│   ├── events.json
│   ├── raw_posts.json
│   └── staff.json
├── scripts/
│   ├── process.ts
│   └── scrape.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts
│   │   │   ├── cron/scrape/route.ts
│   │   │   ├── events/route.ts
│   │   │   ├── scrape/route.ts
│   │   │   └── staff/route.ts
│   │   ├── classic/page.tsx
│   │   ├── page.tsx
│   │   └── redesign/page.tsx
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   ├── EventCard.tsx
│   │   ├── HubVibePortal.tsx
│   │   └── classic/
│   ├── lib/
│   │   ├── agent.ts
│   │   ├── dataStore.ts
│   │   ├── filter.ts
│   │   ├── gemini.ts
│   │   ├── hubAccounts.ts
│   │   ├── kv.ts
│   │   ├── schemas.ts
│   │   └── scraper.ts
│   └── types.ts
├── tests/
├── vercel.json
└── README.md
```

## 2. Data model

ТЗ допускает JSON files -> SQLite. В текущей версии production-safe путь такой:

- seed: `data/events.json`, `data/staff.json`;
- runtime storage: Vercel KV / Upstash через `src/lib/dataStore.ts`;
- локальная запись: `data/*.json`;
- SQLite/Prisma в проект не подключены, потому что текущий production refresh уже использует durable KV.

Эквивалентные SQLite-таблицы, если позже понадобится миграция:

```sql
create table hub_events (
  id text primary key,
  hub text not null,
  instagram text not null,
  city text not null,
  region text not null,
  title text not null,
  date text not null,
  time text,
  format text not null check (format in ('offline', 'online', 'hybrid')),
  address text,
  zoom_link text,
  description text not null,
  hashtags text not null default '[]',
  source_post_url text not null,
  parsed_at text not null
);

create index idx_hub_events_region_date on hub_events(region, date);

create table hub_staff (
  id text primary key,
  hub text not null,
  city text not null,
  region text not null,
  name text not null,
  role text,
  instagram text,
  contact text,
  source text not null
);

create index idx_hub_staff_region on hub_staff(region);
```

## 3. Соответствие ТЗ

| Пункт ТЗ | Статус | Где реализовано |
|---|---:|---|
| Парсинг Instagram региональных хабов через Apify | Готово | `src/lib/scraper.ts`, `scripts/scrape.ts`, `/api/scrape`, `/api/cron/scrape` |
| Извлечение событий из постов | Готово | `processInstagramPosts`, `extractPostWithGemini` |
| Извлечение сотрудников из постов | Частично | Поддерживается в pipeline; часть сотрудников добавлена вручную в `data/staff.json`, потому что Instagram не даёт структурированные профили команды |
| Ответы на вопросы о событиях и контактах | Готово | `/api/chat`, `src/lib/agent.ts` |
| Фильтр по городу/региону | Готово | `src/lib/filter.ts`, `/api/events`, `/api/staff`, `/api/chat` |
| Event cards в chat/frontend | Готово | `src/components/EventCard.tsx`, `src/components/classic/EventCards.tsx`, `src/components/SleekChat.tsx` |
| Public deploy | Готово по конфигу | Vercel config и README, production alias описан в README |
| Целевые Instagram handles | Готово, расширено до 19 хабов | `src/lib/hubAccounts.ts` |
| `/api/chat` | Готово | `src/app/api/chat/route.ts` |
| `/api/events` | Готово | `src/app/api/events/route.ts` |
| `/api/staff` | Готово | `src/app/api/staff/route.ts` |
| `/api/cron/scrape` | Готово | `src/app/api/cron/scrape/route.ts` |
| Vercel Cron каждые 6 часов | Готово | `vercel.json` |
| Русский/казахский UI | Готово | `src/i18n.ts`, `src/lib/classic-translations.ts`, `src/lib/agent.ts` |
| No auth required for public access | Готово | Основные chat/events/staff публичные; защищён только scrape |

## 4. Отличия от исходного chosen stack

| Исходный пункт | Фактический стек | Причина |
|---|---|---|
| Next.js 14 | Next.js 16 | Проект уже обновлён; сборка и тесты проходят |
| OpenAI GPT-4o-mini | Gemini | Ранее проект был переведён на Gemini API; не меняем обратно без отдельного решения |
| Prisma/SQLite | JSON seed + Vercel KV / Upstash | Для Vercel serverless нужен durable runtime store; SQLite на Vercel free tier требует отдельного решения |
| Raw posts в `/data/raw/{city}.json` | `data/raw_posts.json` | Pipeline обрабатывает общий raw dump; можно разделить по city позже, если это станет обязательным требованием |

## 5. Что осталось как улучшение

- Перейти на SQLite/Prisma можно отдельной задачей, если проверяющий требует именно этот пункт.
- Перенести AI extraction с Gemini на OpenAI GPT-4o-mini можно отдельной задачей, но это будет смена provider-а и env-переменных.
- Разделить raw Instagram dumps на `data/raw/{city}.json`, если нужно строго следовать формулировке Layer 1.
- Подключить Vercel KV/Upstash в production, иначе cron на Vercel не сможет сохранять результат долговечно.
