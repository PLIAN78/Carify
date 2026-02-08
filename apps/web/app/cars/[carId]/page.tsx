"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { api, Car, Claim } from "@/lib/api";
import AnchorProofButton from "@/components/AnchorProofButton";
import VerifyProofButton from "@/components/VerifyProofButton";

export default function CarDetailPage() {
  const params = useParams<{ carId: string }>();
  const carId = params.carId;
  const [score, setScore] = useState<number | null>(null);

  const [car, setCar] = useState<Car | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [explanation, setExplanation] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [err, setErr] = useState<string>("");

  const carName = useMemo(() => {
    if (!car) return "";
    return `${car.year} ${car.make} ${car.model}`;
  }, [car]);

  async function loadAll() {
    if (!carId) return;

    setLoading(true);
    setErr("");

    try {
      const [carRes, claimsRes, scoreRes] = await Promise.all([
  api.getCar(carId),
  api.getClaimsForCar(carId),
  api.getCarScore(carId),
]);

setCar(carRes.car);
setClaims(claimsRes.claims);
setScore(scoreRes.score);

    } catch (e: any) {
      setErr(e?.message ?? "Failed to load car");
    } finally {
      setLoading(false);
    }
  }

  async function loadExplain() {
    if (!carId) return;
    setLoadingExplain(true);
    try {
      const r = await api.explainCar(carId);
      setExplanation(r.explanation);
    } catch (e: any) {
      setExplanation(e?.message ?? "Failed to generate explanation");
    } finally {
      setLoadingExplain(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-neutral-400 hover:text-white">
            ← Back
          </Link>

          <h1 className="text-2xl font-bold mt-2">
            {carName || "Car Details"}
          </h1>

          <div className="text-xs text-neutral-500">
            Car ID: <span className="font-mono">{carId}</span>
          </div>
        </div>

        <Link
          href={`/submit?carId=${encodeURIComponent(carId)}`}
          className="px-4 py-2 rounded-xl bg-white text-black text-sm"
        >
          Submit claim
        </Link>
      </div>
      <div className="border border-neutral-800 rounded-2xl p-4 flex items-center gap-6">
  <div className="text-4xl font-bold">
    {score ?? "—"}
  </div>
  <div>
    <div className="text-sm text-neutral-300">Car Score</div>
    <div className="text-xs text-neutral-500">
      Based on verified user claims
    </div>
  </div>
</div>

      {/* Status */}
      {loading && <div className="text-sm text-neutral-400">Loading…</div>}
      {err && <div className="text-sm text-red-400">{err}</div>}
    
      {/* AI Explanation */}
      <div className="border border-neutral-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Summary (Gemini)</h2>
          <button
            onClick={loadExplain}
            disabled={loadingExplain}
            className="px-3 py-2 text-xs rounded-lg border border-neutral-800 hover:bg-neutral-900 disabled:opacity-50"
          >
            {loadingExplain ? "Thinking…" : "Generate"}
          </button>
        </div>

        {explanation ? (
          <pre className="whitespace-pre-wrap text-sm text-neutral-300">
            {explanation}
          </pre>
        ) : (
          <div className="text-sm text-neutral-500">
            Generate an AI overview based on submitted claims.
          </div>
        )}
      </div>

      {/* Claims */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Claims</h2>

        {claims.length === 0 && (
          <div className="text-sm text-neutral-400">
            No claims yet. Be the first to submit one.
          </div>
        )}

        {claims.map((claim) => (
          <div
            key={claim._id}
            className="border border-neutral-800 rounded-xl p-4 space-y-3"
          >
            {/* Claim header */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-300">
                {claim.category}
              </div>
              <div className="text-xs text-neutral-500">
                {new Date(claim.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Claim body */}
            <div className="text-sm">{claim.statement}</div>

            <div className="text-xs text-neutral-400">
              Evidence: {claim.evidenceSummary}
            </div>

            <div className="text-xs text-neutral-500">
              By {claim.contributor.displayName} ({claim.contributor.type})
            </div>

            {/* Solana proof */}
            <div className="pt-3 border-t border-neutral-800 flex flex-wrap gap-2 items-center">
              <AnchorProofButton claim={claim} />
              <VerifyProofButton claim={claim} />

              {claim.solana?.txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${claim.solana.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline break-all"
                >
                  View on Solana Explorer
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-neutral-600">
        API: {api.baseUrl}
      </div>
    </div>
  );
}
