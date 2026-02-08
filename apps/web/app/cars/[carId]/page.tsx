"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { api, Car, Claim } from "@/lib/api";

export default function CarDetailPage(props: { params: { carId: string } }) {
  const params = props.params;
  const carId = params.carId;

  const [car, setCar] = useState<Car | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    api.getCar(carId).then((r) => setCar(r.car)).catch((e) => setErr(e.message));
    api.getClaims(carId).then((r) => setClaims(r.claims)).catch((e) => setErr(e.message));
  }, [carId]);

  async function loadExplanation() {
    setLoadingExplain(true);
    setErr(null);
    try {
      const r = await api.explain(carId);
      setExplanation(r.explanation);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoadingExplain(false);
    }
  }

  return (
    <div className="space-y-6">
      <a href="/" className="text-sm text-neutral-400 hover:text-white">← Back</a>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="text-2xl font-semibold">
          {car ? `${car.year} ${car.make} ${car.model}` : carId}
        </div>
        <div className="mt-2 text-sm text-neutral-300">
          Claims below are stored off-chain but anchored via proof hashes (and tx when available).
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={loadExplanation}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            {loadingExplain ? "Explaining..." : "Explain reputation (AI)"}
          </button>
          <a
            href="/submit"
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-500"
          >
            Submit a claim
          </a>
        </div>

        {explanation && (
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-200">
{explanation}
          </pre>
        )}
      </div>

      {err && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Claims</h2>

        {claims.length === 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
            No claims yet. Be the first to submit.
          </div>
        )}

        <div className="grid gap-4">
          {claims.map((c) => (
            <div
              key={c._id ?? c.proof?.hash ?? c.statement}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-200">
                  {c.category}
                </span>
                <span className="text-xs text-neutral-400">
                  by {c.contributor?.displayName} ({c.contributor?.type})
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="mt-3 text-base font-medium">{c.statement}</div>
              <div className="mt-2 text-sm text-neutral-300">{c.evidenceSummary}</div>

              <div className="mt-4 grid gap-2 text-xs text-neutral-400">
                <div>
                  <span className="text-neutral-500">Proof hash:</span>{" "}
                  <span className="font-mono text-neutral-200">
                    {c.proof?.hash ?? "pending"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Solana tx:</span>{" "}
                  <span className="font-mono text-neutral-200">
                    {c.proof?.solanaTx ?? "pending"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
