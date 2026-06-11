import { ChatInterface } from "@/components/ChatInterface";
import { readEvents } from "@/lib/dataStore";
import { filterUpcomingEvents } from "@/lib/filter";
import { HUB_ACCOUNTS } from "@/lib/hubAccounts";

// Re-read the durable store every 5 minutes so cron updates surface without a redeploy.
export const revalidate = 300;

export default async function Home() {
  const upcomingEvents = filterUpcomingEvents(await readEvents());

  return (
    <ChatInterface
      hubCount={HUB_ACCOUNTS.length}
      demoEventCount={upcomingEvents.length}
      featuredEvents={upcomingEvents.slice(0, 4)}
    />
  );
}
