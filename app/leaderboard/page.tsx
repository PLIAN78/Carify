export default async function LeaderboardPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/cars`, {
    cache: "no-store",
  });
  const { cars } = await res.json();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Carify</h1>
      <p className="text-sm text-gray-500 mt-1">
        Evidence-weighted car reputation
      </p>

      <div className="mt-6 space-y-3">
        {cars.map((c: any) => (
          <a
            key={c.id}
            href={`/cars/${c.id}`}
            className="block rounded-xl border p-4 hover:bg-gray-50"
          >
            <div className="font-semibold">
              {c.make} {c.model} ({c.year})
            </div>
            <div className="text-sm text-gray-600">
              Carify Score: coming next
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
