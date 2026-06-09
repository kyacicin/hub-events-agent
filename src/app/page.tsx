import events from "../../data/events.json";
import { ChatInterface } from "@/components/ChatInterface";
import { HUB_ACCOUNTS } from "@/lib/hubAccounts";

export default function Home() {
  return (
    <ChatInterface
      hubCount={HUB_ACCOUNTS.length}
      demoEventCount={events.length}
    />
  );
}
