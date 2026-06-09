import { Icon } from "@/components/Icon";
import type { HubEvent } from "@/lib/schemas";

type EventCardProps = {
  event: HubEvent;
};

const FORMAT_LABELS: Record<HubEvent["format"], string> = {
  offline: "Offline",
  online: "Online",
  hybrid: "Hybrid",
};

const FORMAT_STYLES: Record<HubEvent["format"], string> = {
  offline: "bg-[#eef5ff] text-[#2466a8]",
  online: "bg-[#eefaf2] text-[#4ca364]",
  hybrid: "bg-[#fff7df] text-[#916b14]",
};

export function EventCard({ event }: EventCardProps) {
  const location = event.address ?? event.zoom_link ?? "Link in hub profile";

  return (
    <article className="rounded-xl border border-[#e0e6df] bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${FORMAT_STYLES[event.format]}`}
            >
              {FORMAT_LABELS[event.format]}
            </span>
            <span className="text-xs font-semibold text-[#687168]">{event.city}</span>
          </div>
          <h3 className="mt-2 text-sm font-bold leading-5 text-[#202124]">
            {event.title}
          </h3>
        </div>
        <a
          href={event.source_post_url}
          target="_blank"
          rel="noreferrer"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-[#e0e6df] text-[#687168] transition hover:border-[#4ca364] hover:text-[#4ca364]"
          aria-label="Open source post"
        >
          <Icon name="link" className="size-4" />
        </a>
      </div>

      <dl className="mt-3 grid gap-2 text-xs leading-5 text-[#5e6860]">
        <div className="flex gap-2">
          <Icon name="calendar" className="mt-0.5 size-4 text-[#8a938b]" />
          <dd>
            {formatDate(event.date)}
            {event.time ? `, ${event.time}` : ""}
          </dd>
        </div>
        <div className="flex gap-2">
          <Icon
            name={event.format === "online" ? "globe" : "map"}
            className="mt-0.5 size-4 text-[#8a938b]"
          />
          <dd>{location}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm leading-5 text-[#3f4741]">{event.description}</p>

      <a
        href={`https://www.instagram.com/${event.instagram.replace("@", "")}/`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 break-all text-xs font-bold text-[#4ca364] underline-offset-2 hover:underline"
      >
        <Icon name="instagram" className="size-4" />
        {event.instagram}
      </a>
    </article>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00+05:00`));
}
