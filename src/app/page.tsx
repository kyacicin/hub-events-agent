import eventsData from "../../data/events.json";
import { ChatInterface } from "@/components/ChatInterface";
import { HUB_ACCOUNTS } from "@/lib/hubAccounts";
import { isHubEvent } from "@/lib/schemas";

const events = (eventsData as unknown[]).filter(isHubEvent);

export default function Home() {
  return (
    <ChatInterface
      hubCount={HUB_ACCOUNTS.length}
      demoEventCount={events.length}
      featuredEvents={events.slice(0, 4)}
    />
  );
}
