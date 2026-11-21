export default function DoctorsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
          />
        ))}
      </div>
    </main>
  );
}
