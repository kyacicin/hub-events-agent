import HubVibePortal from "@/components/HubVibePortal";
import { buildHubOptions, toUiEvent, toUiMember } from "@/data";
import { readEvents, readStaff } from "@/lib/dataStore";
import { filterUpcomingEvents } from "@/lib/filter";

export const metadata = {
  title: "Astana Hub — события региональных хабов (Redesign)",
  description:
    "AI-агент по событиям региональных хабов Astana Hub: карусель событий, команда хабов, расписание и чат с региональным фильтром.",
};

export const revalidate = 300;

export default async function RedesignPage() {
  const [events, staff] = await Promise.all([readEvents(), readStaff()]);
  const uiEvents = filterUpcomingEvents(events).map(toUiEvent);
  const uiMembers = staff.map(toUiMember);

  return (
    <HubVibePortal
      events={uiEvents}
      members={uiMembers}
      hubs={buildHubOptions()}
    />
  );
}
