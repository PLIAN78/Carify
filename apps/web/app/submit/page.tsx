"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function SubmitClaimPage() {
  const [carId, setCarId] = useState("toyota-camry-2019");
  const [category, setCategory] = useState<
    "reliability" | "ownership_cost" | "comfort" | "efficiency" | "safety"
  >("reliability");
  const [statement, setStatement] = useState(
    "Transmission issues are rare before 120,000 km."
  );
  const [evidenceSummary, setEvidenceSummary] = useState(
    "8 owner logs over 2 years, no major transmission repairs reported."
  );
  const [contribType, setContribType] = useState<"owner" | "mechanic" | "expert">(
    "owner"
  );
  const [displayName, setDisplayName] = useState("Verified Owner A");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ hash: string; solanaTx?: string } | null>(
    null
  );
  const [err, setErr] = useState<string | null>(null);

  // ✅ upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState<string>("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const evidencePreviewSrc =
    evidenceUrl && (evidenceUrl.startsWith("http") ? evidenceUrl : `${apiBase}${evidenceUrl}`);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || uploading) return;

    setSubmitting(true);
    setErr(null);
    setResult(null);

    try {
      // ✅ 1) upload file (optional)
      let uploadedUrl = evidenceUrl; // if already uploaded, reuse
      if (file && !uploadedUrl) {
        setUploading(true);
        try {
          uploadedUrl = await api.uploadImage(file); // returns "/uploads/xxx.jpg"
          setEvidenceUrl(uploadedUrl);
        } finally {
          setUploading(false);
        }
      }

      // ✅ 2) create claim with evidenceUrl
      const r = await api.createClaim({
        carId,
        category,
        statement,
        evidenceSummary,
        evidenceUrl: uploadedUrl, // ✅ include image link
        evidence: { samples: 8, avgMileageKm: 92000 },
        contributor: { type: contribType, displayName },
      });

      setResult(r.proof);
      setFile(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-neutral-800/80 bg-neutral-850/40">
      {/* Steel base */}
      <div className="pointer-events-none absolute inset-0 bg-neutral-950" />

      {/* Brushed steel sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80
                   bg-[linear-gradient(120deg,
                   rgba(225,225,225,0.10),
                   rgba(255,255,255,0.03)_35%,
                   rgba(0,0,0,0.25)_70%,
                   rgba(255,255,255,0.06))]"
      />

      {/* Highlight bloom */}
      <div
        className="pointer-events-none absolute inset-0
                   bg-[radial-gradient(80%_55%_at_20%_0%,
                   rgba(255,255,255,0.10),
                   transparent_60%)]"
      />

      {/* Content */}
      <div className="relative space-y-10 p-6 sm:p-8">
        {/* Header */}
        <section className="space-y-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
          >
            ← Back
          </a>

          <h1 className="text-3xl font-semibold tracking-tight">Submit a claim</h1>

          <p className="max-w-2xl text-sm leading-relaxed text-neutral-300">
            Claims are stored off-chain and anchored with a cryptographic proof hash
            (and Solana transaction when available).
          </p>
        </section>

        {/* Form panel */}
        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur p-6 space-y-6"
        >
          {/* Car + category */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="text-xs text-neutral-400">Car ID</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm outline-none focus:border-neutral-600"
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
              />
            </label>

            <label className="space-y-2">
              <div className="text-xs text-neutral-400">Category</div>
              <select
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm outline-none focus:border-neutral-600"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="reliability">reliability</option>
                <option value="ownership_cost">ownership_cost</option>
                <option value="comfort">comfort</option>
                <option value="efficiency">efficiency</option>
                <option value="safety">safety</option>
              </select>
            </label>
          </div>

          {/* Statement */}
          <label className="space-y-2 block">
            <div className="text-xs text-neutral-400">Claim statement</div>
            <textarea
              className="w-full min-h-[96px] rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm outline-none focus:border-neutral-600"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
            />
          </label>

          {/* Evidence summary */}
          <label className="space-y-2 block">
            <div className="text-xs text-neutral-400">Evidence summary</div>
            <textarea
              className="w-full min-h-[96px] rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm outline-none focus:border-neutral-600"
              value={evidenceSummary}
              onChange={(e) => setEvidenceSummary(e.target.value)}
            />
          </label>

          {/* ✅ Evidence image upload */}
          <div className="space-y-3">
            <div className="text-xs text-neutral-400">Evidence image (optional)</div>

            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-neutral-200 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-100 hover:file:bg-neutral-700"
              onChange={(e) => {
                setErr(null);
                setResult(null);
                setEvidenceUrl(""); // reset if selecting a new file
                setFile(e.target.files?.[0] ?? null);
              }}
            />

            {file && !evidenceUrl && (
              <div className="text-xs text-neutral-500">
                Selected: <span className="text-neutral-200">{file.name}</span>
              </div>
            )}

            {evidencePreviewSrc && (
              <img
                src={evidencePreviewSrc}
                alt="Evidence preview"
                style={{
                  width: "100%",
                  height: 200,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder-car.png";
                }}
              />
            )}

            {/* Optional: explicit upload button (uploads immediately) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!file || uploading || submitting || !!evidenceUrl}
                className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 disabled:opacity-60"
                onClick={async () => {
                  if (!file) return;
                  setErr(null);
                  setUploading(true);
                  try {
                    const url = await api.uploadImage(file);
                    setEvidenceUrl(url);
                  } catch (e: any) {
                    setErr(e?.message || "Upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                {evidenceUrl ? "Uploaded" : uploading ? "Uploading…" : "Upload image"}
              </button>

              <span className="text-xs text-neutral-500">
                {evidenceUrl ? `Saved as ${evidenceUrl}` : "Uploads to your backend (/uploads)"}
              </span>
            </div>
          </div>

          {/* Contributor */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="text-xs text-neutral-400">Contributor type</div>
              <select
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm outline-none focus:border-neutral-600"
                value={contribType}
                onChange={(e) => setContribType(e.target.value as any)}
              >
                <option value="owner">owner</option>
                <option value="mechanic">mechanic</option>
                <option value="expert">expert</option>
              </select>
            </label>

            <label className="space-y-2">
              <div className="text-xs text-neutral-400">Display name</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm outline-none focus:border-neutral-600"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              disabled={submitting || uploading}
              type="submit"
              className="rounded-xl bg-white/95 px-5 py-3 text-sm font-medium text-black hover:bg-white disabled:opacity-60 transition"
            >
              {uploading ? "Uploading…" : submitting ? "Submitting…" : "Submit claim"}
            </button>

            <span className="text-xs text-neutral-400">
              Proof hash generated after submission
            </span>
          </div>

          {/* Success */}
          {result && (
            <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
              <div className="font-medium">Claim submitted</div>
              <div className="mt-2 text-xs text-neutral-200">
                Proof hash: <span className="font-mono">{result.hash}</span>
              </div>
              <div className="mt-1 text-xs text-neutral-200">
                Solana tx:{" "}
                <span className="font-mono">{result.solanaTx ?? "pending"}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {err && (
            <div className="rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
