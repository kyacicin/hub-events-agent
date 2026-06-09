export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 font-sans text-foreground">
      <main className="w-full max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Phase 1
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
          Hub Events Agent
        </h1>
        <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Next.js and Tailwind are ready for the first backend and chat
          routes.
        </p>
      </main>
    </div>
  );
}
