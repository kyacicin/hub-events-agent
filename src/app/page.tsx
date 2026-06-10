import eventsData from "../../data/events.json";
import { ChatInterface } from "@/components/ChatInterface";
import { filterUpcomingEvents } from "@/lib/filter";
import { HUB_ACCOUNTS } from "@/lib/hubAccounts";
import { isHubEvent } from "@/lib/schemas";

const events = (eventsData as unknown[]).filter(isHubEvent);

export default function Home() {
  const upcomingEvents = filterUpcomingEvents(events);

  return (
    <ChatInterface
      hubCount={HUB_ACCOUNTS.length}
      demoEventCount={upcomingEvents.length}
      featuredEvents={upcomingEvents.slice(0, 4)}
    />
  );
}
