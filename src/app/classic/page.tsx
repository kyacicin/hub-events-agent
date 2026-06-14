import ClassicPortal from "@/components/classic/ClassicPortal";
import { readEvents, readStaff } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [events, staff] = await Promise.all([readEvents(), readStaff()]);
  return <ClassicPortal initialEvents={events} initialStaff={staff} />;
}
