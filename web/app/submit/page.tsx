"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function SubmitClaimPage() {
  const [carId, setCarId] = useState("toyota-camry-2019");
  const [category, setCategory] = useState<"reliability"|"ownership_cost"|"comfort"|"efficiency"|"safety">("reliability");
  const [statement, setStatement] = useState("Transmission issues are rare before 120,000 km.");
  const [evidenceSummary, setEvidenceSummary] = useState("8 owner logs over 2 years, no major transmission repairs reported.");
  const [contribType, setContribType] = useState<"owner"|"mechanic"|"expert">("owner");
  const [displayName, setDisplayName] = useState("Verified Owner A");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ hash: string; solanaTx?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    setResult(null);
    try {
      const r = await api.createClaim({
        carId,
        category,
        statement,
        evidenceSummary,
        evidence: { samples: 8, avgMileageKm: 92000 },
        contributor: { type: contribType, displayName },
      });
      setResult(r.proof);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <a href="/" className="text-sm text-neutral-400 hover:text-white">← Back</a>

      <div>
        <h1 className="text-2xl font-semibold">Submit a claim</h1>
        <p className="mt-2 text-sm text-neutral-300 max-w-2xl">
          Your claim is stored off-chain, then anchored with a proof hash (and tx when available).
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-xs text-neutral-400">Car ID</div>
            <input className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
              value={carId} onChange={(e) => setCarId(e.target.value)} />
          </label>

          <label className="space-y-2">
            <div className="text-xs text-neutral-400">Category</div>
            <select className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
              value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="reliability">reliability</option>
              <option value="ownership_cost">ownership_cost</option>
              <option value="comfort">comfort</option>
              <option value="efficiency">efficiency</option>
              <option value="safety">safety</option>
            </select>
          </label>
        </div>

        <label className="space-y-2 block">
          <div className="text-xs text-neutral-400">Claim statement</div>
          <textarea className="w-full min-h-[88px] rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={statement} onChange={(e) => setStatement(e.target.value)} />
        </label>

        <label className="space-y-2 block">
          <div className="text-xs text-neutral-400">Evidence summary</div>
          <textarea className="w-full min-h-[88px] rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={evidenceSummary} onChange={(e) => setEvidenceSummary(e.target.value)} />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-xs text-neutral-400">Contributor type</div>
            <select className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
              value={contribType} onChange={(e) => setContribType(e.target.value as any)}>
              <option value="owner">owner</option>
              <option value="mechanic">mechanic</option>
              <option value="expert">expert</option>
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-xs text-neutral-400">Display name</div>
            <input className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
        </div>

        <button
          disabled={submitting}
          className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
          type="submit"
        >
          {submitting ? "Submitting..." : "Submit claim"}
        </button>

        {result && (
          <div className="rounded-xl border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-200">
            <div>✅ Submitted</div>
            <div className="mt-2 text-xs text-neutral-200">
              Proof hash: <span className="font-mono">{result.hash}</span>
            </div>
            <div className="mt-1 text-xs text-neutral-200">
              Solana tx: <span className="font-mono">{result.solanaTx ?? "pending"}</span>
            </div>
          </div>
        )}

        {err && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}
      </form>
    </div>
  );
}
