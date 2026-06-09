import { HUB_ACCOUNTS } from "@/lib/hubAccounts";

export default function Home() {
  return (
    <div className="flex flex-1 bg-background px-5 py-10 font-sans text-foreground sm:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="flex flex-col gap-4 border-b border-zinc-200 pb-7 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
              Phase 1
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              Hub Events Agent
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
              Next.js, Tailwind, and the regional Instagram source list are
              ready for the first scraper and chat routes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left sm:min-w-72">
            <div className="border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {HUB_ACCOUNTS.length}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Instagram sources</p>
            </div>
            <div className="border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                2
              </p>
              <p className="mt-1 text-sm text-zinc-500">Required secrets</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Tracked hub profiles
            </h2>
            <p className="text-sm text-zinc-500">
              Source of truth for Apify Instagram scraping.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HUB_ACCOUNTS.map((account) => (
              <article
                key={account.instagram}
                className="border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {account.hub}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      @{account.instagram}
                    </p>
                  </div>
                  <span className="shrink-0 border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    {account.city}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
