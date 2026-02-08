"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  api,
  type Car,
  type ClaimCategory,
  type ContributorType,
  type UploadedFile,
} from "@/lib/api";

function isMongoId(s: string) {
  return /^[a-f\d]{24}$/i.test(s);
}

export default function SubmitClaimPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const carId = searchParams.get("carId") || searchParams.get("id") || "";

  const [car, setCar] = useState<Car | null>(null);

  const [category, setCategory] = useState<ClaimCategory>("reliability");
  const [statement, setStatement] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [contribType, setContribType] = useState<ContributorType>("owner");
  const [displayName, setDisplayName] = useState("");

  // attachments
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  const carDisplayName = useMemo(() => {
    if (!car) return "(unknown)";
    return `${car.year} ${car.make} ${car.model}`;
  }, [car]);

  useEffect(() => {
    setErr("");
    setOkMsg("");
    setCar(null);

    if (!carId || !isMongoId(carId)) return;

    api
      .getCar(carId)
      .then((r) => setCar(r.car))
      .catch((e: any) => setErr(e?.message ?? "Failed to load car"));
  }, [carId]);

  async function uploadSelected() {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErr("");
    try {
      const r = await api.uploadFiles(selectedFiles);
      setUploadedFiles((prev) => [...prev, ...r.files]);
      setSelectedFiles([]);
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeUploaded(url: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    if (!carId || !isMongoId(carId)) {
      setErr('Invalid carId. Click “Submit claim” from a car page.');
      return;
    }

    if (!statement.trim() || !evidenceSummary.trim() || !displayName.trim()) {
      setErr("Please fill statement, evidence summary, and display name.");
      return;
    }

    // If files are selected but not uploaded yet, auto upload first
    if (selectedFiles.length > 0 && uploadedFiles.length === 0) {
      await uploadSelected();
      if (selectedFiles.length > 0) {
        // upload failed
        return;
      }
    }

    setSubmitting(true);
    try {
      const r = await api.createClaim({
        carId,
        category,
        statement: statement.trim(),
        evidenceSummary: evidenceSummary.trim(),
        evidenceUrl: "",
        attachments: uploadedFiles.map((f) => ({
          url: f.url,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
        })),
        contributor: {
          type: contribType,
          displayName: displayName.trim(),
        },
      });

      setOkMsg(`✅ Claim saved. claimId=${r.claimId}`);

      router.push(`/cars/${encodeURIComponent(carId)}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-neutral-400 hover:text-white">
        ← Back
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Submit a claim</h1>

        <div className="text-sm text-neutral-300">
          Car: <span className="font-medium">{carDisplayName}</span>
        </div>

        <div className="text-sm text-neutral-400">
          Car ID: <span className="font-mono">{carId || "(missing)"}</span>
        </div>

        {!carId || !isMongoId(carId) ? (
          <div className="text-sm text-red-400 mt-2">
            Invalid carId. Click “Submit claim” from a car page.
          </div>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4"
      >
        <label className="block space-y-2">
          <div className="text-xs text-neutral-400">Category</div>
          <select
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as ClaimCategory)}
          >
            <option value="reliability">reliability</option>
            <option value="ownership_cost">ownership_cost</option>
            <option value="comfort">comfort</option>
            <option value="efficiency">efficiency</option>
            <option value="safety">safety</option>
          </select>
        </label>

        <label className="block space-y-2">
          <div className="text-xs text-neutral-400">Claim statement</div>
          <textarea
            className="w-full min-h-[88px] rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <div className="text-xs text-neutral-400">Evidence summary</div>
          <textarea
            className="w-full min-h-[88px] rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={evidenceSummary}
            onChange={(e) => setEvidenceSummary(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-2">
            <div className="text-xs text-neutral-400">Contributor type</div>
            <select
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
              value={contribType}
              onChange={(e) => setContribType(e.target.value as ContributorType)}
            >
              <option value="owner">owner</option>
              <option value="mechanic">mechanic</option>
              <option value="expert">expert</option>
            </select>
          </label>

          <label className="block space-y-2">
            <div className="text-xs text-neutral-400">Display name</div>
            <input
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <div className="text-xs text-neutral-400">Attachments (images or any files)</div>

          <input
            type="file"
            multiple
            className="block w-full text-sm"
            onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
          />

          {selectedFiles.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="text-xs text-neutral-500">
                {selectedFiles.length} file(s) selected
              </div>
              <button
                type="button"
                onClick={uploadSelected}
                disabled={uploading}
                className="px-3 py-2 text-xs rounded-lg border border-neutral-800 hover:bg-neutral-900 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload files"}
              </button>
            </div>
          ) : null}

          {uploadedFiles.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-neutral-500">Uploaded:</div>
              <div className="space-y-2">
                {uploadedFiles.map((f) => {
                  const isImage = f.mimeType?.startsWith("image/");
                  const fullUrl = `${api.baseUrl}${f.url}`;

                  return (
                    <div
                      key={f.url}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={fullUrl}
                            alt={f.originalName}
                            className="w-12 h-12 object-cover rounded-lg border border-neutral-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-neutral-800 flex items-center justify-center text-xs text-neutral-500">
                            FILE
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="text-sm truncate">{f.originalName}</div>
                          <div className="text-xs text-neutral-500 truncate">
                            {f.mimeType} • {(f.size / 1024).toFixed(1)} KB
                          </div>
                          <a
                            className="text-xs text-blue-400 hover:underline break-all"
                            href={fullUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeUploaded(f.url)}
                        className="px-3 py-2 text-xs rounded-lg border border-neutral-800 hover:bg-neutral-900"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-600">
              Tip: upload screenshots, receipts, mechanic notes, or anything that supports your claim.
            </div>
          )}
        </div>

        {err ? <div className="text-sm text-red-400">{err}</div> : null}
        {okMsg ? <div className="text-sm text-green-400">{okMsg}</div> : null}

        <button
          disabled={submitting || !carId || !isMongoId(carId)}
          className="px-4 py-3 rounded-xl bg-white text-black text-sm disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit claim"}
        </button>
      </form>

      <div className="text-xs text-neutral-600">API: {api.baseUrl}</div>
    </div>
  );
}
