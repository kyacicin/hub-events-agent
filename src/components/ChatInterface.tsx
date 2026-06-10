"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EventCard } from "@/components/EventCard";
import { Icon, type IconName } from "@/components/Icon";
import type { HubEvent, HubStaff } from "@/lib/schemas";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  events?: HubEvent[];
  staff?: HubStaff[];
  modelStatus?: "ok" | "fallback";
};

type ChatResponse = {
  reply: string;
  events: HubEvent[];
  staff: HubStaff[];
  region: string | null;
  city: string | null;
  modelStatus: "ok" | "fallback";
};

type ChatInterfaceProps = {
  hubCount: number;
  demoEventCount: number;
  featuredEvents: HubEvent[];
};

const QUICK_PROMPTS = [
  "Я из Тараза. Какие есть события?",
  "Павлодардағы іс-шаралар қандай?",
  "Что есть в Астане на этой неделе?",
  "Кто команда Zhambyl Hub?",
];

const NAV_ITEMS: Array<{ label: string; icon: IconName; active?: boolean }> = [
  { label: "Home", icon: "home" },
  { label: "Community", icon: "users" },
  { label: "Programs", icon: "sparkles" },
  { label: "Hub Market", icon: "globe" },
  { label: "Events", icon: "calendar", active: true },
  { label: "Online Courses", icon: "message" },
  { label: "Customer support", icon: "users" },
  { label: "FAQ", icon: "message" },
];

const REGION_SHORTCUTS = ["Астана", "Алматы", "Тараз", "Павлодар"];

export function ChatInterface({
  hubCount,
  demoEventCount,
  featuredEvents,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Сәлем! Я помогу найти события Astana Hub по городу, формату или дате.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const canSend = input.trim().length > 0 && !isSending;
  const apiMessages = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function submitMessage(text: string) {
    const content = text.trim();

    if (!content || isSending) {
      return;
    }

    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...apiMessages,
            { role: userMessage.role, content: userMessage.content },
          ],
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Chat request failed.");
      }

      const data = (await response.json()) as ChatResponse;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          events: data.events,
          staff: data.staff,
          modelStatus: data.modelStatus,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Не удалось получить ответ.",
          modelStatus: "fallback",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(input);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f6] text-[#202124]">
      <header className="sticky top-0 z-30 border-b border-[#e3e5e2] bg-white">
        <div className="flex h-20 items-center gap-4 px-5 sm:px-8">
          <div className="flex w-[220px] shrink-0 items-center gap-3">
            <AstanaLogo />
            <span className="text-xl font-semibold tracking-[-0.01em]">
              astana hub
            </span>
          </div>

          <label className="hidden h-14 w-full max-w-md items-center gap-3 rounded-lg border border-[#dedfdd] bg-white px-4 text-[#71757a] md:flex">
            <Icon name="search" className="size-6" />
            <input
              aria-label="Search"
              placeholder="Search..."
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#7b7f86]"
            />
          </label>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-[#6f747a] transition hover:bg-[#f2f4f1]"
              aria-label="AI recommendations"
            >
              <Icon name="sparkles" className="size-6" />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full text-[#6f747a] transition hover:bg-[#f2f4f1]"
              aria-label="Messages"
            >
              <Icon name="message" className="size-6" />
            </button>
            <div className="grid size-12 place-items-center rounded-full border-4 border-[#d6dae0] bg-[#f8f8f8] text-sm font-semibold text-[#9aa0a6]">
              K
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e4e5e3] bg-[#f7f7f6] px-5 py-8 lg:block">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex h-12 items-center gap-3 rounded-lg px-4 text-left text-[15px] font-semibold transition ${
                  item.active
                    ? "border border-[#d9f1df] bg-[#eefaf2] text-[#202124]"
                    : "text-[#25272a] hover:bg-white"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`size-5 ${
                    item.active ? "text-[#4ca364]" : "text-[#7b8085]"
                  }`}
                />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-[#e1e3e0] pt-5">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-full border border-[#dfe2df] bg-white px-3 text-sm font-medium text-[#4d5358]"
            >
              <Icon name="globe" className="size-4" />
              English
              <Icon name="chevron-down" className="size-4" />
            </button>
          </div>
        </aside>

        <div className="grid gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_410px] lg:px-8 xl:gap-8">
          <section className="min-w-0">
            <div className="overflow-hidden rounded-xl bg-[#25282b] shadow-sm">
              <div className="flex min-h-36 items-center justify-between gap-5 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(90deg,rgba(0,0,0,0.72),rgba(0,0,0,0.28))] px-6 py-7 text-white sm:px-9">
                <div>
                  <p className="text-sm text-white/75">
                    The main innovation hub of Kazakhstan
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                    Hold your event at Astana Hub
                  </h1>
                </div>
                <button
                  type="button"
                  className="hidden rounded-lg bg-white px-6 py-4 text-base font-semibold text-[#242629] shadow-sm sm:block"
                >
                  Learn more
                </button>
              </div>
            </div>

            <div className="mt-12">
              <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#181a1d]">
                Events
              </h2>
              <p className="mt-3 max-w-5xl text-base leading-7 text-[#74777b]">
                The Events module helps users find announcements, view events,
                and ask the AI assistant for the nearest regional hub activity.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex h-14 items-center gap-2 rounded-lg bg-[#4ca364] px-5 text-base font-semibold text-white shadow-sm"
                >
                  <span className="grid size-6 place-items-center rounded-full border border-white/70 text-lg leading-none">
                    +
                  </span>
                  Add event
                </button>
                <button
                  type="button"
                  className="h-14 rounded-lg border border-[#dedfdd] bg-white px-6 text-base font-semibold text-[#242629] shadow-sm"
                >
                  My events
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-[#777b80]">
                {demoEventCount} events
              </p>
              <div className="hidden items-center gap-2 rounded-full border border-[#dde1dc] bg-white px-3 py-2 text-sm text-[#697078] md:flex">
                <Icon name="sparkles" className="size-4 text-[#4ca364]" />
                AI assistant reads regional events
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {featuredEvents.map((event) => (
                <WebsiteEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          <aside className="min-w-0">
            <div className="sticky top-24 grid gap-4">
              <FilterPanel hubCount={hubCount} />
              <AssistantPanel
                input={input}
                isSending={isSending}
                messages={messages}
                canSend={canSend}
                feedEndRef={feedEndRef}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                onKeyDown={handleInputKeyDown}
                onPrompt={submitMessage}
              />
            </div>
          </aside>
        </div>
      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 grid size-16 place-items-center rounded-full bg-[#4ca364] text-white shadow-[0_18px_50px_rgba(76,163,100,0.35)] lg:hidden"
        aria-label="Open AI chat"
      >
        <Icon name="message" className="size-8" />
      </button>
    </main>
  );
}

function AstanaLogo() {
  return (
    <span className="relative grid size-12 place-items-center rounded-full">
      <span className="absolute size-12 rounded-full bg-black/10" />
      <span className="absolute size-9 rounded-full bg-black/15" />
      <span className="size-5 rounded-full bg-[#111]" />
    </span>
  );
}

function WebsiteEventCard({ event }: { event: HubEvent }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#e2e4e1] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 text-sm font-semibold text-[#3f4449]">
        <Icon name="calendar" className="size-5 text-[#8a8f94]" />
        <span>{formatShortDate(event.date)}</span>
        {event.time ? <span>{event.time}</span> : null}
        <span className="ml-auto flex items-center gap-1 text-[#62676d]">
          <Icon name="map" className="size-5 text-[#8a8f94]" />
          {event.city}
        </span>
      </div>

      <div className="mt-4 aspect-[16/9] overflow-hidden rounded-lg bg-[#dfe6e2]">
        <div className="flex h-full flex-col justify-end bg-[radial-gradient(circle_at_75%_35%,rgba(76,163,100,0.38),transparent_30%),linear-gradient(135deg,#1f2a34,#6d7b83)] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            {event.hub}
          </p>
          <h3 className="mt-2 text-xl font-bold leading-6">{event.title}</h3>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-base font-semibold leading-6 text-[#25282c]">
        {event.description}
      </p>
    </article>
  );
}

function FilterPanel({ hubCount }: { hubCount: number }) {
  return (
    <section className="rounded-xl border border-[#e0e2df] bg-white p-4 shadow-sm">
      <label className="flex h-12 items-center gap-3 rounded-lg border border-[#e2e4e1] px-3 text-[#85898f]">
        <Icon name="search" className="size-5" />
        <input
          aria-label="Search events"
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
      </label>
      <FilterSelect label="Region" value="Choose" />
      <FilterSelect label="Area" value="Choose" />
      <div className="mt-4">
        <p className="text-sm font-bold text-[#25282c]">Status</p>
        <div className="mt-2 grid grid-cols-2 rounded-lg border border-[#e2e4e1] bg-white p-1">
          <button
            type="button"
            className="h-11 rounded-md bg-[#eefaf2] text-sm font-semibold text-[#4ca364]"
          >
            Soon
          </button>
          <button
            type="button"
            className="h-11 rounded-md text-sm font-semibold text-[#25282c]"
          >
            Completed
          </button>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-[#f6f8f5] p-3 text-sm text-[#687078]">
        <span className="font-semibold text-[#25282c]">{hubCount}</span> regional hubs
        connected to assistant search.
      </div>
    </section>
  );
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-bold text-[#25282c]">{label}</p>
      <button
        type="button"
        className="mt-2 flex h-12 w-full items-center justify-between rounded-lg border border-[#e2e4e1] px-4 text-left text-base font-semibold text-[#25282c]"
      >
        {value}
        <Icon name="chevron-down" className="size-5 text-[#85898f]" />
      </button>
    </div>
  );
}

type AssistantPanelProps = {
  input: string;
  isSending: boolean;
  messages: UiMessage[];
  canSend: boolean;
  feedEndRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPrompt: (prompt: string) => Promise<void>;
};

function AssistantPanel({
  input,
  isSending,
  messages,
  canSend,
  feedEndRef,
  onInputChange,
  onSubmit,
  onKeyDown,
  onPrompt,
}: AssistantPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#dce2dc] bg-white shadow-[0_18px_60px_rgba(35,42,38,0.12)]">
      <header className="flex items-center gap-3 border-b border-[#edf0ec] px-4 py-4">
        <span className="grid size-11 place-items-center rounded-full bg-[#eef0ff] text-[#4b55d9]">
          <Icon name="bot" className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#202124]">Astana Hub AI</h2>
          <p className="text-xs font-medium text-[#788078]">
            Event assistant for this page
          </p>
        </div>
        <button
          type="button"
          className="ml-auto grid size-9 place-items-center rounded-full text-[#747b73] transition hover:bg-[#f4f6f3]"
          aria-label="Refresh assistant"
        >
          <Icon name="refresh" className="size-5" />
        </button>
      </header>

      <div className="flex max-h-[520px] min-h-[360px] flex-col gap-4 overflow-y-auto bg-[#fbfcfb] px-4 py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isSending ? (
          <div className="mr-auto flex items-center gap-2 rounded-2xl border border-[#e0e6df] bg-white px-4 py-3 text-sm text-[#687168]">
            <Icon name="sparkles" className="size-4 text-[#4ca364]" />
            Ищу события в базе
          </div>
        ) : null}
        <div ref={feedEndRef} />
      </div>

      <div className="border-t border-[#edf0ec] bg-white p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void onPrompt(prompt)}
              disabled={isSending}
              className="shrink-0 rounded-full border border-[#dfe5de] bg-white px-3 py-2 text-xs font-semibold text-[#4d5550] transition hover:border-[#4ca364] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {REGION_SHORTCUTS.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => void onPrompt(`Я из ${city}. Какие есть события?`)}
              disabled={isSending}
              className="shrink-0 rounded-full bg-[#eefaf2] px-3 py-1.5 text-xs font-bold text-[#4ca364] transition hover:bg-[#dff4e6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {city}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <label htmlFor="chat-message" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-message"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Ask about events..."
            className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border border-[#dfe3df] bg-[#fbfcfb] px-3 py-3 text-sm leading-5 outline-none transition placeholder:text-[#8a918b] focus:border-[#4ca364] focus:ring-2 focus:ring-[#4ca364]/10"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="grid size-12 place-items-center rounded-xl bg-[#4ca364] text-white transition hover:bg-[#438f59] disabled:cursor-not-allowed disabled:bg-[#cfd8d0]"
            aria-label="Send message"
          >
            <Icon name="send" className="size-5" />
          </button>
        </form>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-[#eef0ff] text-[#4b55d9]">
          <Icon name="bot" className="size-4" />
        </span>
      ) : null}
      <div className={`flex min-w-0 max-w-[92%] flex-col gap-3 ${isUser ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
            isUser
              ? "bg-[#4ca364] text-white"
              : "border border-[#e0e6df] bg-white text-[#28302a]"
          }`}
        >
          <p className="whitespace-pre-line">{message.content}</p>
          {!isUser && message.modelStatus === "fallback" ? (
            <p className="mt-3 border-t border-[#edf0ec] pt-2 text-xs text-[#9a6b22]">
              Ответ собран локально без Gemini API.
            </p>
          ) : null}
        </div>

        {!isUser && message.events?.length ? (
          <div className="grid w-full gap-3">
            {message.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : null}

        {!isUser && message.staff?.length ? (
          <div className="grid w-full gap-2">
            {message.staff.map((person) => (
              <StaffCard key={person.id} person={person} />
            ))}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-[#f0f1f0] text-[#6e7470]">
          <Icon name="user" className="size-4" />
        </span>
      ) : null}
    </div>
  );
}

function StaffCard({ person }: { person: HubStaff }) {
  return (
    <article className="rounded-xl border border-[#e0e6df] bg-white p-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eefaf2] text-[#4ca364]">
          <Icon name="users" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f7870]">
            {person.city}
          </p>
          <h3 className="mt-1 text-sm font-bold text-[#202124]">{person.name}</h3>
          {person.role ? (
            <p className="mt-1 text-sm leading-5 text-[#616a63]">{person.role}</p>
          ) : null}
          {person.instagram ? (
            <a
              href={`https://www.instagram.com/${person.instagram.replace("@", "")}/`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 break-all text-xs font-semibold text-[#4ca364] underline-offset-2 hover:underline"
            >
              <Icon name="instagram" className="size-4" />
              {person.instagram}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00+05:00`));
}
