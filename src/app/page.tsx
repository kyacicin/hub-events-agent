import HubVibePortal from "@/components/HubVibePortal";
import { buildHubOptions, toUiEvent, toUiMember } from "@/data";
import { readEvents, readStaff } from "@/lib/dataStore";
import { filterUpcomingEvents } from "@/lib/filter";

export const metadata = {
  title: "HubVibe Portal — события региональных хабов Astana Hub",
  description:
    "AI-агент по событиям региональных хабов Astana Hub: карусель событий, команда хабов, расписание и чат с региональным фильтром.",
};

// Re-read the durable store every 5 minutes so data refreshes surface
// without a redeploy.
export const revalidate = 300;

export default async function Home() {
  const [events, staff] = await Promise.all([readEvents(), readStaff()]);
  const uiEvents = filterUpcomingEvents(events).map(toUiEvent);
  const uiMembers = staff.map(toUiMember);

  return (
    <HubVibePortal
      events={uiEvents}
      members={uiMembers}
      hubs={buildHubOptions(uiEvents, uiMembers)}
    />
  );
}
