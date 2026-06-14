import { NextResponse, type NextRequest } from "next/server";
import { readStaff } from "@/lib/dataStore";
import { filterStaff } from "@/lib/filter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  const region = request.nextUrl.searchParams.get("region");
  const staff = filterStaff(await readStaff(), { city, region });

  return NextResponse.json({
    staff,
    count: staff.length,
    filters: {
      city,
      region,
    },
  });
}
