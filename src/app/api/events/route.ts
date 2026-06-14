import { NextResponse, type NextRequest } from "next/server";
import { readEvents } from "@/lib/dataStore";
import { dateKey, filterEvents } from "@/lib/filter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  const region = request.nextUrl.searchParams.get("region");
  const includePast = request.nextUrl.searchParams.get("includePast") === "true";
  const today = request.nextUrl.searchParams.get("today") ?? dateKey(new Date());
  const events = filterEvents(await readEvents(), {
    city,
    region,
    today,
    includePast,
  });

  return NextResponse.json({
    events,
    count: events.length,
    filters: {
      city,
      region,
      includePast,
      today,
    },
  });
}
