import type { HubEvent } from "@/lib/schemas";

type EventCardProps = {
  event: HubEvent;
};

const FORMAT_LABELS: Record<HubEvent["format"], string> = {
  offline: "ОФЛАЙН",
  online: "ОНЛАЙН",
  hybrid: "ГИБРИД",
};

const FORMAT_STYLES: Record<HubEvent["format"], string> = {
  offline: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  online:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  hybrid:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span
            className={`inline-flex rounded border px-2 py-1 text-[11px] font-semibold uppercase tracking-normal ${FORMAT_STYLES[event.format]}`}
          >
            {FORMAT_LABELS[event.format]}
          </span>
          <h3 className="mt-3 text-sm font-semibold leading-5 text-zinc-950 dark:text-zinc-50">
            {event.title}
          </h3>
        </div>
        <div className="shrink-0 text-left text-xs text-zinc-500 sm:text-right dark:text-zinc-400">
          <p>{formatDate(event.date)}</p>
          {event.time ? <p className="mt-1">{event.time}</p> : null}
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <div>
          <dt className="sr-only">Адрес</dt>
          <dd>{event.address ?? event.zoom_link ?? "Ссылка в профиле хаба"}</dd>
        </div>
        <div>
          <dt className="sr-only">Описание</dt>
          <dd className="leading-6">{event.description}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
        <span>{event.hub}</span>
        <span aria-hidden="true">/</span>
        <a
          href={`https://www.instagram.com/${event.instagram.replace("@", "")}/`}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {event.instagram}
        </a>
      </div>
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
