"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, Car } from "@/lib/api";

// ✅ Inline fallback (no /public file needed, no 404 spam)
const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' fill='%23aaaaaa' font-size='28' font-family='Arial' dominant-baseline='middle' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

type ScoreInfo = { score: number; claimCount: number };

export default function HomePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // score map: carId -> score info
  const [scores, setScores] = useState<Record<string, ScoreInfo>>({});
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    setErr(null);
    setLoading(true);

    api
      .listCars()
      .then((r) => setCars(r.cars))
      .catch((e) => setErr(e.message || "Failed to load cars"))
      .finally(() => setLoading(false));
  }, []);

  // after cars load, fetch scores for each car
  useEffect(() => {
    if (cars.length === 0) return;

    // only fetch scores we don't already have
    const missing = cars.filter((c) => !scores[c.carId]);
    if (missing.length === 0) return;

    let cancelled = false;
    setLoadingScores(true);

    Promise.allSettled(missing.map((c) => api.getCarScore(c.carId)))
      .then((results) => {
        if (cancelled) return;

        setScores((prev) => {
          const next = { ...prev };
          for (let i = 0; i < missing.length; i++) {
            const carId = missing[i].carId;
            const r = results[i];
            if (r.status === "fulfilled") {
              next[carId] = { score: r.value.score, claimCount: r.value.claimCount };
            } else {
              // if score endpoint fails for a car, don’t break UI
              next[carId] = { score: 70, claimCount: 0 };
            }
          }
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingScores(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cars;
    return cars.filter(
      (c) =>
        `${c.year} ${c.make} ${c.model}`.toLowerCase().includes(s) ||
        c.carId.toLowerCase().includes(s)
    );
  }, [cars, q]);

  // ✅ use api.baseUrl so you don’t drift between env vars
  const API_BASE = (api.baseUrl || "http://localhost:3001").replace(/\/$/, "");

  function resolveCarImage(c: Car) {
    const raw = (c.imageUrl || "").trim();
    if (!raw) return FALLBACK;

    // already absolute (http/https)
    if (/^https?:\/\//i.test(raw)) return raw;

    // normalize to start with "/"
    let p = raw.startsWith("/") ? raw : `/${raw}`;

    // if DB has "/api/uploads/...", strip the "/api"
    if (p.startsWith("/api/uploads/")) {
      p = p.replace("/api", "");
    }

    return `${API_BASE}${p}`;
  }

  function scoreColor(score: number) {
    if (score >= 85) return "border-emerald-900/60 bg-emerald-950/30 text-emerald-200";
    if (score >= 70) return "border-blue-900/60 bg-blue-950/30 text-blue-200";
    if (score >= 55) return "border-amber-900/60 bg-amber-950/30 text-amber-200";
    return "border-red-900/60 bg-red-950/30 text-red-200";
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-neutral-800/80 bg-neutral-850/40">
      {/* Steel base */}
      <div className="pointer-events-none absolute inset-0 bg-neutral-850" />

      {/* Brushed steel direction */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80
                   bg-[linear-gradient(120deg,
                   rgba(225,225,225,0.10),
                   rgba(255,255,255,0.03)_35%,
                   rgba(0,0,0,0.25)_70%,
                   rgba(255,255,255,0.06))]"
      />

      {/* Top-left highlight bloom */}
      <div
        className="pointer-events-none absolute inset-0
                   bg-[radial-gradient(80%_55%_at_20%_0%,
                   rgba(255,255,255,0.10),
                   transparent_60%)]"
      />

      {/* Content wrapper */}
      <div className="relative space-y-10 p-6 sm:p-8">
        {/* Hero */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1 text-xs text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Proof-anchored claims • AI summaries • On-chain verification
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Verifiable Car Reputation
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-neutral-300">
            Rankings built from <span className="text-white">claims with proof hashes</span>,
            not sponsored opinions. AI summarizes only what’s provided—no hallucinated “reviews.”
          </p>
        </section>

        {/* Search */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
                <span className="select-none text-neutral-500">⌕</span>
                <input
                  className="w-full bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
                  placeholder="Search make, model, or year (e.g., Camry 2019, Model 3)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                Tip: try “camry”, “2021”, or paste a carId.
              </div>
            </div>

            <div className="flex items-center gap-2 sm:pl-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300">
                Showing <span className="text-white">{filtered.length}</span>
              </div>

              <Link
                href="/submit"
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition"
              >
                Submit claim
              </Link>
            </div>
          </div>

          {err && (
            <div className="mt-4 rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              <div className="font-medium">Couldn’t load cars</div>
              <div className="mt-1 text-red-200/80">{err}</div>
            </div>
          )}
        </section>

        {/* Grid */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-medium text-neutral-200">Browse cars</h2>
            <div className="text-xs text-neutral-500">
              {loadingScores ? "Scoring…" : "Click a card to view claims & proof hashes"}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-3xl border border-neutral-800 bg-neutral-900/70 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => {
                  const imgSrc = resolveCarImage(c);
                  const s = scores[c.carId]; // may be undefined briefly
                  const score = s?.score;
                  const claimCount = s?.claimCount ?? 0;

                  return (
                    <Link
                      key={c.carId}
                      href={`/cars/${c.carId}`}
                      className="group rounded-3xl border border-neutral-800 bg-neutral-900/70 p-5 transition hover:border-neutral-600 hover:bg-neutral-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold tracking-tight text-neutral-100">
                            {c.year} {c.make} {c.model}
                          </div>
                          <div className="mt-1 text-xs text-neutral-500 font-mono">
                            {c.carId}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-xs",
                              score == null
                                ? "border-neutral-700 bg-neutral-950 text-neutral-300"
                                : scoreColor(score),
                            ].join(" ")}
                          >
                            Score{" "}
                            <span className="text-white">
                              {score == null ? "…" : score}
                            </span>
                          </span>

                          <span className="rounded-full border border-neutral-700 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-200">
                            {claimCount} claim{claimCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <img
                        src={imgSrc}
                        alt={`${c.make} ${c.model}`}
                        style={{
                          width: "100%",
                          height: 160,
                          objectFit: "cover",
                          borderRadius: 12,
                          marginTop: 16,
                        }}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK;
                        }}
                      />

                      <p className="mt-4 text-sm leading-relaxed text-neutral-300">
                        View claims, on-chain proof hashes, and an AI explanation summary.
                      </p>

                      <div className="mt-4 inline-flex items-center gap-2 text-xs text-neutral-400">
                        <span className="rounded-full bg-neutral-800 px-2 py-1">claims</span>
                        <span className="rounded-full bg-neutral-800 px-2 py-1">
                          proof hashes
                        </span>
                        <span className="rounded-full bg-neutral-800 px-2 py-1">AI explain</span>
                        <span className="ml-auto text-neutral-500 group-hover:text-neutral-300 transition">
                          View →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-neutral-800 bg-neutral-950/60 p-6 text-sm text-neutral-400">
                  No cars found. Try a broader search like “2021” or “Toyota”.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
