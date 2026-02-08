"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Car } from "@/lib/api";

export default function HomePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.listCars()
      .then((r) => setCars(Array.isArray(r?.cars) ? r.cars : []))
      .catch((e) => setErr(e.message));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cars;
    return cars.filter(
      (c) =>
        `${c.year} ${c.make} ${c.model}`.toLowerCase().includes(s) ||
        c.carId.includes(s)
    );
  }, [cars, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Verifiable Car Reputation</h1>
        <p className="mt-2 text-neutral-300 max-w-2xl">
          Rankings built from <span className="text-white">claims with proof hashes</span>, not sponsored opinions.
          AI summarizes only what’s provided.
        </p>
      </div>

      <input
        className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm outline-none focus:border-neutral-600"
        placeholder="Search a car model (e.g., camry, model-3...)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {err && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <a
            key={c.carId}
            href={`/cars/${c.carId}`}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition"
          >
            <div className="text-lg font-medium">
              {c.year} {c.make} {c.model}
            </div>
            <div className="mt-2 text-xs text-neutral-400">
              carId: {c.carId}
            </div>
            <div className="mt-4 text-sm text-neutral-300">
              View claims, on-chain proof hashes, and an AI explanation.
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-neutral-400">No cars found.</div>
      )}
    </div>
  );
}
