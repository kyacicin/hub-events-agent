"use client";

import { FormEvent, useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import type { HubEvent, HubStaff } from "@/lib/schemas";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  events?: HubEvent[];
  staff?: HubStaff[];
};

type ChatResponse = {
  reply: string;
  events: HubEvent[];
  staff: HubStaff[];
  region: string | null;
  city: string | null;
  modelStatus: "ok" | "fallback";
};

const QUICK_PROMPTS = [
  "Я из Тараза. Какие есть события?",
  "Павлодардағы іс-шаралар қандай?",
  "Кто команда Astana Hub?",
];

export function ChatInterface({
  hubCount,
  demoEventCount,
}: {
  hubCount: number;
  demoEventCount: number;
}) {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Сәлем! Привет.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canSend = input.trim().length > 0 && !isSending;
  const apiMessages = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

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
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
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

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto grid w-full max-w-7xl grid-rows-[auto_1fr] gap-0 px-4 py-4 sm:px-6 lg:grid-cols-[300px_1fr] lg:grid-rows-1 lg:gap-6 lg:py-6">
        <aside className="hidden border-r border-zinc-200 pr-6 lg:block dark:border-zinc-800">
          <div className="sticky top-6 flex h-[calc(100vh-48px)] flex-col">
            <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Hub Events Agent
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-normal">
                Regional Hub Chat
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 py-5 dark:border-zinc-800">
              <div>
                <p className="text-2xl font-semibold">{hubCount}</p>
                <p className="mt-1 text-xs text-zinc-500">Instagram sources</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{demoEventCount}</p>
                <p className="mt-1 text-xs text-zinc-500">Demo events</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 py-5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submitMessage(prompt)}
                  disabled={isSending}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[calc(100vh-48px)]">
          <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-5">
            <div>
              <p className="text-sm font-semibold">Hub Events Agent</p>
              <p className="mt-1 text-xs text-zinc-500">
                {hubCount} sources · {demoEventCount} seeded events
              </p>
            </div>
            <div className="hidden gap-2 sm:flex">
              {QUICK_PROMPTS.slice(0, 2).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submitMessage(prompt)}
                  disabled={isSending}
                  className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-950"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-5">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                />
              ))}
              {isSending ? (
                <div className="mr-auto rounded-md border border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800">
                  AI is typing
                </div>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-zinc-200 p-4 dark:border-zinc-800 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label
                htmlFor="chat-message"
                className="sr-only"
              >
                Message
              </label>
              <textarea
                id="chat-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                placeholder="Напишите сообщение"
                className="min-h-12 flex-1 resize-none rounded-md border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
              >
                Отправить
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex w-full max-w-3xl flex-col gap-3 ${isUser ? "items-end" : ""}`}>
        <div
          className={`rounded-md px-4 py-3 text-sm leading-6 ${
            isUser
              ? "max-w-[85%] bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
              : "max-w-[92%] border border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          }`}
        >
          <p className="whitespace-pre-line">{message.content}</p>
        </div>

        {!isUser && message.events?.length ? (
          <div className="grid w-full gap-3">
            {message.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
