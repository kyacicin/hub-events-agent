# AGENTS.md — Документация AI-агента

> Техническое описание архитектуры, поведения и логики Hub Events Agent

---

## Обзор агента

Hub Events Agent — это AI-агент на базе Claude API, который:
1. Принимает сообщение пользователя на русском или казахском языке
2. Определяет регион (город) пользователя
3. Достаёт релевантные события и данные о команде из локальной базы
4. Формирует структурированный ответ с карточками событий

Агент работает как **stateless RAG-пайплайн** — каждый запрос обрабатывается независимо, данные подгружаются из JSON-файлов, результат возвращается в чат.

---

## Архитектура агента

```
Пользователь
    │
    │ "Привет, я из Тараза. Что есть в ближайшее время?"
    ▼
┌─────────────────────────────────────────────────────────┐
│                    API Route /api/chat                   │
│                                                         │
│  1. Загрузка данных из data/events.json                 │
│                        data/staff.json                  │
│                                                         │
│  2. Формирование system prompt                          │
│     (роль агента + данные о событиях + данные о команде)│
│                                                         │
│  3. Отправка в Claude API                               │
│     model: claude-sonnet-4-20250514                     │
│     max_tokens: 1000                                    │
│                                                         │
│  4. Возврат структурированного ответа                   │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Чат-интерфейс (карточки событий + текст)
```

---

## System Prompt агента

Агент получает следующий системный промпт при каждом запросе:

```
Ты — AI-ассистент региональных хабов Astana Hub в Казахстане.

Твоя задача:
1. Определить город/регион пользователя из его сообщения
2. Найти релевантные предстоящие события для этого региона
3. Рассказать о команде хаба, если спрашивают
4. Отвечать на русском или казахском — в зависимости от языка пользователя

Правила:
- Показывай только предстоящие события (дата >= сегодня)
- Если город не указан — попроси уточнить
- Формат события: [ФОРМАТ] Название / Дата · Время · Адрес / Описание
- Если событий нет — честно скажи об этом и предложи следить за обновлениями

База данных событий:
{EVENTS_JSON}

База данных команды:
{STAFF_JSON}

Сегодняшняя дата: {TODAY}
```

Переменные `{EVENTS_JSON}`, `{STAFF_JSON}`, `{TODAY}` подставляются динамически при каждом запросе.

---

## Структура данных

### events.json

```json
[
  {
    "id": "evt_001",
    "hub": "Zhambyl Hub",
    "instagram": "@zhambyl_hub",
    "city": "Тараз",
    "region": "zhambyl",
    "title": "Demo Day: предынкубация",
    "date": "2025-06-14",
    "time": "14:00",
    "format": "offline",
    "address": "ул. Толе би 58, зал 201",
    "description": "Финальные презентации стартапов первого потока.",
    "hashtags": ["#DemoDay", "#AstanaHub", "#Taraz"],
    "source_post_url": "https://instagram.com/p/...",
    "parsed_at": "2025-06-09T09:00:00Z"
  },
  {
    "id": "evt_002",
    "hub": "Zhambyl Hub",
    "instagram": "@zhambyl_hub",
    "city": "Тараз",
    "region": "zhambyl",
    "title": "Cursor AI воркшоп",
    "date": "2025-06-20",
    "time": "11:00",
    "format": "online",
    "address": null,
    "zoom_link": "ссылка в @zhambyl_hub",
    "description": "Практический воркшоп по работе с Cursor AI для разработчиков.",
    "hashtags": ["#CursorAI", "#Workshop"],
    "source_post_url": "https://instagram.com/p/...",
    "parsed_at": "2025-06-09T09:00:00Z"
  }
]
```

**Поля события:**

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Уникальный идентификатор |
| `hub` | string | Название хаба |
| `instagram` | string | Instagram-аккаунт хаба |
| `city` | string | Город (отображаемое название) |
| `region` | string | Регион-ключ для фильтрации |
| `title` | string | Название события |
| `date` | string (ISO) | Дата события |
| `time` | string | Время события |
| `format` | `"offline"` \| `"online"` \| `"hybrid"` | Формат |
| `address` | string \| null | Адрес (для офлайн) |
| `description` | string | Описание из поста |
| `hashtags` | string[] | Хэштеги из поста |
| `source_post_url` | string | Ссылка на оригинальный пост |
| `parsed_at` | string (ISO) | Время парсинга |

---

### staff.json

```json
[
  {
    "id": "staff_001",
    "hub": "Zhambyl Hub",
    "city": "Тараз",
    "region": "zhambyl",
    "name": "Азиз Сейткали",
    "role": "Директор",
    "instagram": "@aziz_hub",
    "contact": null,
    "source": "instagram_highlights"
  },
  {
    "id": "staff_002",
    "hub": "Zhambyl Hub",
    "city": "Тараз",
    "region": "zhambyl",
    "name": "Мария Алибекова",
    "role": "Региональный менеджер",
    "instagram": null,
    "contact": "maria@astanahub.com",
    "source": "instagram_post"
  }
]
```

**Поля сотрудника:**

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Уникальный идентификатор |
| `hub` | string | Название хаба |
| `city` | string | Город |
| `region` | string | Регион-ключ |
| `name` | string | Имя и фамилия |
| `role` | string | Должность |
| `instagram` | string \| null | Instagram-аккаунт |
| `contact` | string \| null | Email или телефон |
| `source` | string | Откуда взяты данные |

---

## Логика фильтрации по региону

Агент определяет регион пользователя через Claude — модель понимает синонимы и варианты написания:

```
"Тараз" → region: "zhambyl"
"Жамбыл" → region: "zhambyl"
"Алматы" → region: "almaty"
"Алма-Ата" → region: "almaty"
"Нур-Султан" → region: "astana"
"Астана" → region: "astana"
```

Нормализация происходит внутри LLM — не через хардкод. Claude сопоставляет текст пользователя с ключами регионов из базы данных.

---

## Парсер (Apify)

### Как работает

1. **Триггер:** cron-задача на Vercel (`0 9 * * *`) → `GET /api/scrape`
2. **Apify запрос:** отправляется задача на Instagram Scraper Actor
3. **Обработка:** посты фильтруются, из них извлекаются данные о событиях
4. **Сохранение:** `data/events.json` и `data/staff.json` обновляются

### Какие Instagram-аккаунты парсятся

```typescript
const HUB_ACCOUNTS = [
  { instagram: "turkistan.hub",  hub: "Turkistan Hub", region: "turkistan",        city: "Туркестан" },
  { instagram: "batys.hub",      hub: "Batys Hub",     region: "west_kazakhstan",  city: "Уральск" },
  { instagram: "almaty_hub",     hub: "Almaty Hub",    region: "almaty",           city: "Алматы" },
  { instagram: "zhambyl_hub",    hub: "Zhambyl Hub",   region: "zhambyl",          city: "Тараз" },
  { instagram: "alatau.hub",     hub: "Alatau Hub",    region: "alatau",           city: "Алатау" },
  { instagram: "atyrau_it_hub",  hub: "Atyrau Hub",    region: "atyrau",           city: "Атырау" },
  { instagram: "shymkent__hub",  hub: "Shymkent Hub",  region: "shymkent",         city: "Шымкент" },
  { instagram: "qostanai.hub",   hub: "Qostanai Hub",  region: "kostanay",         city: "Костанай" },
  { instagram: "pavlodar.hub",   hub: "Pavlodar Hub",  region: "pavlodar",         city: "Павлодар" },
  { instagram: "oskemen.hub",    hub: "Oskemen Hub",   region: "east_kazakhstan",  city: "Оскемен" },
  { instagram: "aqtobe.hub",     hub: "Aqtobe Hub",    region: "aktobe",           city: "Актобе" },
  { instagram: "aqmola.hub",     hub: "Aqmola Hub",    region: "aqmola",           city: "Кокшетау" },
  { instagram: "mangystau.hub",  hub: "Mangystau Hub", region: "mangystau",        city: "Актау" },
  { instagram: "kyzylordahub",   hub: "Kyzylorda Hub", region: "kyzylorda",        city: "Кызылорда" },
  { instagram: "ulytau.hub",     hub: "Ulytau Hub",    region: "ulytau",           city: "Жезказган" },
  { instagram: "sko_hub",        hub: "SKO Hub",       region: "north_kazakhstan", city: "Петропавловск" },
  { instagram: "jetisu_digital", hub: "Jetisu Digital",region: "jetisu",           city: "Талдыкорган" },
  { instagram: "semey.hub",      hub: "Semey Hub",     region: "abai",             city: "Семей" },
];
```

### Извлечение структуры события из поста

После получения сырых постов из Apify, Claude вызывается повторно для структурированного извлечения данных:

```typescript
// Промпт для структурирования данных из поста
const extractionPrompt = `
Из этого Instagram-поста извлеки данные о событии в JSON.
Если это не анонс события — верни null.

Текст поста:
${post.caption}

Дата публикации: ${post.timestamp}

Верни JSON:
{
  "title": "название события или null",
  "date": "YYYY-MM-DD или null",
  "time": "HH:MM или null",
  "format": "offline|online|hybrid",
  "address": "адрес или null",
  "description": "краткое описание"
}
`;
```

---

## Карточки событий

Каждое событие отображается в виде карточки в UI:

```
┌────────────────────────────────────────┐
│ [ОФЛАЙН]  Demo Day: предынкубация      │
│ 📅 14 июня 2025  ·  🕑 14:00          │
│ 📍 ул. Толе би 58, зал 201             │
│ ─────────────────────────────────────  │
│ Финальные презентации стартапов        │
│ первого потока.                        │
│                                        │
│ Zhambyl Hub · @zhambyl_hub             │
└────────────────────────────────────────┘
```

Бейдж формата:
- 🟢 `ОНЛАЙН` — зелёный
- 🔵 `ОФЛАЙН` — синий
- 🟡 `ГИБРИД` — жёлтый

---

## Переменные окружения

| Переменная | Где взять | Назначение |
|-----------|-----------|-----------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Claude API для агента и парсинга |
| `APIFY_API_TOKEN` | console.apify.com | Instagram Scraper |

---

## Ограничения и известные проблемы

- **Instagram без авторизации** — Apify работает через публичные профили; приватные аккаунты не парсятся
- **Извлечение дат** — если в посте дата написана нестандартно («в эту пятницу», «завтра»), LLM может ошибиться; рекомендуется ручная проверка
- **Данные о сотруднике** — Instagram Highlights закрыты без авторизации; данные о команде собираются преимущественно из постов
- **Rate limits Apify** — бесплатный план ограничен; для production рекомендуется платный тариф

---

## Расширение агента

Чтобы добавить новый хаб:
1. Добавь аккаунт в `HUB_ACCOUNTS` в `src/lib/hubAccounts.ts`
2. Запусти `npm run scrape` — данные подтянутся автоматически
3. Новый регион начнёт работать без изменений в коде агента

Чтобы добавить новый язык интерфейса:
1. Добавь переводы в `lib/i18n.ts`
2. Агент автоматически отвечает на языке пользователя (логика в system prompt)

---
