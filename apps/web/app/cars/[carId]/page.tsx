"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Connection, PublicKey } from "@solana/web3.js";
import { api, type Car, type Claim } from "@/lib/api";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(text: string) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return bytesToHex(new Uint8Array(digest));
}

async function readPdaFirst32Hex(proofPda: string) {
  const conn = new Connection(RPC_URL, "confirmed");
  const info = await conn.getAccountInfo(new PublicKey(proofPda));
  if (!info?.data || info.data.length < 32) throw new Error("PDA not found / invalid");
  return bytesToHex(info.data.slice(0, 32));
}

type VerifyState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "verified" }
  | { status: "invalid"; reason: string };

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.carId as string;

  const [car, setCar] = useState<Car | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [verifyMap, setVerifyMap] = useState<Record<string, VerifyState>>({});
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplain, setLoadingExplain] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const carDisplayName = useMemo(() => {
    if (!car) return "";
    return `${car.year} ${car.make} ${car.model}`;
  }, [car]);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [c, cl] = await Promise.all([
        api.getCar(carId),
        api.getClaimsForCar(carId),
      ]);
      setCar(c.car);
      setClaims(cl.claims);

      const init: Record<string, VerifyState> = {};
      for (const x of cl.claims) init[x._id] = { status: "idle" };
      setVerifyMap(init);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load car");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!carId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  async function verifyClaim(claim: Claim) {
    try {
      if (!claim.solana?.proofPda) {
        setVerifyMap((m) => ({ ...m, [claim._id]: { status: "invalid", reason: "No PDA" } }));
        return;
      }
      if (!claim.canonical) {
        setVerifyMap((m) => ({ ...m, [claim._id]: { status: "invalid", reason: "Missing canonical" } }));
        return;
      }

      setVerifyMap((m) => ({ ...m, [claim._id]: { status: "pending" } }));

      const payload = `${claim.canonical}${claim.solana.wallet}${claim.solana.nonce}`;
      const expected = await sha256Hex(payload);
      const onChain = await readPdaFirst32Hex(claim.solana.proofPda);

      if (expected.toLowerCase() !== onChain.toLowerCase()) {
        setVerifyMap((m) => ({ ...m, [claim._id]: { status: "invalid", reason: "Hash mismatch" } }));
        return;
      }

      setVerifyMap((m) => ({ ...m, [claim._id]: { status: "verified" } }));
    } catch (e: any) {
      setVerifyMap((m) => ({ ...m, [claim._id]: { status: "invalid", reason: e?.message ?? "Verify error" } }));
    }
  }

  async function generateExplanation() {
    setLoadingExplain(true);
    try {
      const r = await api.explainCar(carId);
      setExplanation(r.explanation || "");
    } catch (e: any) {
      setExplanation(e?.message ?? "Failed to generate");
    } finally {
      setLoadingExplain(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{carDisplayName || "Car Details"}</h1>
          <div className="text-sm text-neutral-400">
            Car ID: <span className="font-mono text-neutral-200">{carId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-900"
          >
            Refresh
          </button>
          <button
            onClick={() => router.push(`/submit?carId=${encodeURIComponent(carId)}`)}
            className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-900"
          >
            Submit claim
          </button>
        </div>
      </div>

      {loading ? <div className="text-sm text-neutral-400">Loading…</div> : null}
      {err ? <div className="text-sm text-red-400">{err}</div> : null}

      {/* Explanation card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold">Explanation</div>
          <div className="text-sm text-neutral-400 mt-1">
            Click “Generate” to summarize claims + general knowledge (Gemini).
          </div>

          {explanation ? (
            <div className="mt-3 text-sm text-neutral-200 whitespace-pre-wrap">
              {explanation}
            </div>
          ) : null}
        </div>

        <button
          onClick={generateExplanation}
          disabled={loadingExplain}
          className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-950 disabled:opacity-60"
        >
          {loadingExplain ? "Generating…" : "Generate"}
        </button>
      </div>

      {/* Claims */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Claims</h2>

        {claims.length === 0 ? (
          <div className="text-neutral-500">
            No claims yet. Be the first to submit one.
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => {
              const v = verifyMap[c._id] ?? { status: "idle" as const };
              const hasPda = Boolean(c.solana?.proofPda);

              return (
                <div key={c._id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-neutral-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>

                        {v.status === "pending" ? (
                          <div className="text-xs text-neutral-400">Verifying…</div>
                        ) : v.status === "verified" ? (
                          <div className="text-xs text-green-400 font-semibold">Verified ✓</div>
                        ) : v.status === "invalid" ? (
                          <div className="text-xs text-red-400">Invalid: {v.reason}</div>
                        ) : null}
                      </div>

                      <div className="text-sm font-semibold">{c.category}</div>
                      <div className="text-sm text-neutral-200 whitespace-pre-wrap">{c.statement}</div>
                      <div className="text-sm text-neutral-400 whitespace-pre-wrap">{c.evidenceSummary}</div>

                      <div className="text-xs text-neutral-500">
                        by {c.contributor.displayName} ({c.contributor.type})
                      </div>

                      {hasPda ? (
                        <div className="text-xs text-neutral-500 break-all">
                          PDA: {c.solana?.proofPda}
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500">No on-chain proof yet.</div>
                      )}
                    </div>

                    {hasPda ? (
                      <button
                        onClick={() => verifyClaim(c)}
                        className="shrink-0 px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-950 text-sm"
                      >
                        Verify
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-500">
        RPC: {RPC_URL} • API: {api.baseUrl}
      </div>
    </div>
  );
}
