import { NextResponse } from "next/server";
import {
  astanaHubKnowledgeReply,
  callGeminiAgent,
  fallbackAgentReply,
  isStaffQuestion,
  staffAgentReply,
  wantsAllRegions,
  type ChatMessage,
} from "@/lib/agent";
import { readEvents, readStaff } from "@/lib/dataStore";
import {
  dateKey,
  filterEvents,
  filterStaff,
  filterUpcomingEvents,
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
      lang?: unknown;
    };
    const messages = parseMessages(body);

    if (!messages.length) {
      return NextResponse.json(
        { error: "At least one user message is required." },
        { status: 400 },
      );
    }

    const clientLang = typeof body.lang === "string" ? body.lang : undefined;
    const latestMessage = lastUserMessage(messages)?.content ?? "";
    const today = dateKey(new Date());
    const allRegions = wantsAllRegions(latestMessage);
    const staffQuestion = isStaffQuestion(latestMessage);
    const knowledgeReply = astanaHubKnowledgeReply(latestMessage, clientLang);
    const region = allRegions ? null : detectRegion(messages);
    const city = cityForRegion(region);
    const [allEvents, allStaff] = await Promise.all([
      readEvents(),
      readStaff(),
    ]);
    const events = allRegions
      ? filterUpcomingEvents(allEvents, today)
      : region
        ? filterEvents(allEvents, { region, today })
        : [];
    const staff = allRegions
      ? filterStaff(allStaff)
      : region
        ? filterStaff(allStaff, { region })
        : [];
    let reply: string;
    let modelStatus: "ok" | "fallback" = "ok";

    if (knowledgeReply) {
      reply = knowledgeReply;
    } else if (staffQuestion) {
      reply = staffAgentReply({
        latestMessage,
        staff,
        region,
        city,
        allRegions,
        lang: clientLang,
      });
    } else {
      try {
        reply = await callGeminiAgent({
          messages,
          events,
          staff,
          today,
          region,
          city,
          lang: clientLang,
        });
      } catch (error) {
        modelStatus = "fallback";
        reply = fallbackAgentReply({
          latestMessage,
          events,
          staff,
          region,
          city,
          allRegions,
          lang: clientLang,
        });
        console.warn(error instanceof Error ? error.message : String(error));
      }
    }

    return NextResponse.json({
      reply,
      events: staffQuestion || knowledgeReply ? [] : events,
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
