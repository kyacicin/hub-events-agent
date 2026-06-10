import { NextResponse } from "next/server";
import {
  callGeminiAgent,
  fallbackAgentReply,
  type ChatMessage,
} from "@/lib/agent";
import { readEvents, readStaff } from "@/lib/dataStore";
import {
  dateKey,
  filterEvents,
  filterStaff,
  regionFromText,
} from "@/lib/filter";
import { HUB_ACCOUNTS } from "@/lib/hubAccounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: unknown;
      messages?: unknown;
    };
    const messages = parseMessages(body);

    if (!messages.length) {
      return NextResponse.json(
        { error: "At least one user message is required." },
        { status: 400 },
      );
    }

    const latestMessage = lastUserMessage(messages)?.content ?? "";
    const today = dateKey(new Date());
    const region = detectRegion(messages);
    const city = cityForRegion(region);
    const [allEvents, allStaff] = await Promise.all([
      readEvents(),
      readStaff(),
    ]);
    const events = region ? filterEvents(allEvents, { region, today }) : [];
    const staff = region ? filterStaff(allStaff, { region }) : [];
    let reply: string;
    let modelStatus: "ok" | "fallback" = "ok";

    try {
      reply = await callGeminiAgent({
        messages,
        events,
        staff,
        today,
        region,
        city,
      });
    } catch (error) {
      modelStatus = "fallback";
      reply = fallbackAgentReply({
        latestMessage,
        events,
        staff,
        region,
        city,
      });
      console.error(error instanceof Error ? error.message : String(error));
    }

    return NextResponse.json({
      reply,
      events,
      staff,
      region,
      city,
      today,
      modelStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected chat error.",
      },
      { status: 500 },
    );
  }
}

function parseMessages(body: { message?: unknown; messages?: unknown }): ChatMessage[] {
  if (Array.isArray(body.messages)) {
    return body.messages
      .map((message) => {
        if (!message || typeof message !== "object") {
          return null;
        }

        const record = message as Record<string, unknown>;
        const role: ChatMessage["role"] =
          record.role === "assistant" ? "assistant" : "user";
        const content =
          typeof record.content === "string" ? record.content.trim() : "";

        return content ? { role, content: content.slice(0, 4000) } : null;
      })
      .filter((message): message is ChatMessage => Boolean(message))
      .slice(-10);
  }

  if (typeof body.message === "string" && body.message.trim()) {
    return [{ role: "user", content: body.message.trim().slice(0, 4000) }];
  }

  return [];
}

function detectRegion(messages: ChatMessage[]) {
  const latest = lastUserMessage(messages);
  const latestRegion = latest ? regionFromText(latest.content) : null;

  if (latestRegion) {
    return latestRegion;
  }

  for (const message of [...messages].reverse()) {
    const region = regionFromText(message.content);

    if (region) {
      return region;
    }
  }

  return null;
}

function lastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user") ?? null;
}

function cityForRegion(region: string | null) {
  return HUB_ACCOUNTS.find((account) => account.region === region)?.city ?? null;
}
