"use client";

import { useState } from "react";

export default function SubmitClaimPage({
  params,
}: {
  params: { carId: string };
}) {
  const [text, setText] = useState("");
  const [evidenceRaw, setEvidenceRaw] = useState("");
  const [authorWallet, setAuthorWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const evidenceUrls = evidenceRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: params.carId,
          text,
          evidenceUrls,
          authorWallet: authorWallet.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Submit failed");
      setResult(data);
      setText("");
      setEvidenceRaw("");
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const evaluation = result?.evaluation;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Submit a report</h1>
      <p className="text-sm text-gray-500 mt-1">
        Add evidence links to boost verification.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Claim</label>
          <textarea
            className="w-full border rounded p-2 mt-1"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., 2023 Model Y: frequent suspension noise after 10k km..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Evidence URLs (one per line)</label>
          <textarea
            className="w-full border rounded p-2 mt-1"
            rows={4}
            value={evidenceRaw}
            onChange={(e) => setEvidenceRaw(e.target.value)}
            placeholder="https://... (service invoice)\nhttps://... (video)\nhttps://... (official bulletin)"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Wallet (optional)</label>
          <input
            className="w-full border rounded p-2 mt-1"
            value={authorWallet}
            onChange={(e) => setAuthorWallet(e.target.value)}
            placeholder="Solana wallet address (later we’ll sign receipts)"
          />
        </div>

        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>

      {evaluation && (
        <section className="mt-8 border rounded p-4">
          <div className="font-semibold">Gemini Evaluation</div>
          <div className="text-sm text-gray-600 mt-1">
            Status: <b>{evaluation.status}</b> · Proof quality:{" "}
            <b>{evaluation.proofQuality}</b>
          </div>
          <p className="mt-3">{evaluation.summary}</p>

          {evaluation.reasons?.length ? (
            <ul className="mt-3 list-disc pl-5">
              {evaluation.reasons.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : null}

          {evaluation.missingEvidence?.length ? (
            <>
              <div className="mt-4 font-medium">What would make it verifiable?</div>
              <ul className="mt-2 list-disc pl-5">
                {evaluation.missingEvidence.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      )}
    </main>
  );
}
