"use client";

import { useEffect, useState } from "react";
import { api, Claim, Car } from "@/lib/api";
import { useParams } from "next/navigation";

export default function CarPage() {
  const params = useParams<{ carId: string }>();
  const carId = params.carId;

  const [car, setCar] = useState<Car | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [category, setCategory] = useState<Claim["category"]>("reliability");
  const [statement, setStatement] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [displayName, setDisplayName] = useState("Anonymous");

  async function refresh() {
    setErr(null);
    try {
      const [carRes, claimsRes, expRes] = await Promise.all([
        api.getCar(carId),
        api.getClaims(carId),
        api.explain(carId),
      ]);
      setCar(carRes.car);
      setClaims(claimsRes.claims);
      setExplanation(expRes.explanation);
    } catch (e: any) {
      setErr(e.message || "Failed to load");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  async function submitClaim() {
    setErr(null);
    try {
      const body = {
        carId,
        category,
        statement,
        evidenceSummary,
        contributor: { type: "owner" as const, displayName },
      };
      await api.createClaim(body);

      setStatement("");
      setEvidenceSummary("");
      await refresh();
    } catch (e: any) {
      setErr(e.message || "Failed to submit");
    }
  }

  return (
    <div className="space-y-6">
      {err && <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{err}</div>}

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="text-xl font-semibold">
          {car ? `${car.year} ${car.make} ${car.model}` : "Loading car..."}
        </div>
        <div className="mt-3 text-sm text-neutral-300">{explanation}</div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-3">
        <div className="text-lg font-medium">Submit a claim</div>

        <input
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />

        <select
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
        >
          <option value="reliability">reliability</option>
          <option value="ownership_cost">ownership_cost</option>
          <option value="comfort">comfort</option>
          <option value="efficiency">efficiency</option>
          <option value="safety">safety</option>
        </select>

        <input
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Claim statement"
        />

        <textarea
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm"
          value={evidenceSummary}
          onChange={(e) => setEvidenceSummary(e.target.value)}
          placeholder="Evidence summary"
          rows={3}
        />

        <button
          onClick={submitClaim}
          className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700"
          disabled={!statement.trim() || !evidenceSummary.trim()}
        >
          Submit
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-lg font-medium">Claims</div>
        {claims.map((c) => (
          <div key={c._id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm text-neutral-300">
              <span className="text-white font-medium">{c.category}</span> · {c.contributor.displayName} ({c.contributor.type})
            </div>
            <div className="mt-2 text-base">{c.statement}</div>
            <div className="mt-2 text-sm text-neutral-300">{c.evidenceSummary}</div>
            {c.proof?.hash && (
              <div className="mt-3 text-xs text-neutral-400 break-all">proof hash: {c.proof.hash}</div>
            )}
          </div>
        ))}
        {claims.length === 0 && <div className="text-sm text-neutral-400">No claims yet.</div>}
      </div>
    </div>
  );
}
