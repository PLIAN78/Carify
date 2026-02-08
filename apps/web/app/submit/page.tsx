"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api, type ClaimCategory, type ContributorType } from "@/lib/api";

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// ✅ your Solana Playground program id
const PROGRAM_ID = new PublicKey("8WhPVUymg7pgQs2Uca57swzt9SGG7rt3YTqV4pfhesMV");
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

// Phantom typing
declare global {
  interface Window {
    solana?: any;
  }
}

// ----- Borsh helpers (must match your on-chain ix layout) -----
function u32LE(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}
function u64LE(n: number): Buffer {
  const b = Buffer.alloc(8);
  let x = Math.floor(n);
  for (let i = 0; i < 8; i++) {
    b[i] = x & 0xff;
    x = Math.floor(x / 256);
  }
  return b;
}
function borshString(s: string): Buffer {
  const bytes = Buffer.from(s, "utf8");
  return Buffer.concat([u32LE(bytes.length), bytes]);
}
function u64ToLESeed(n: number): Buffer {
  const out = Buffer.alloc(8);
  let x = Math.floor(n);
  for (let i = 0; i < 8; i++) {
    out[i] = x & 0xff;
    x = Math.floor(x / 256);
  }
  return out;
}

function encodeUpsertProofIx(
  claimId: string,
  nonce: number,
  proofHash32: Uint8Array,
  uri: string
): Buffer {
  if (proofHash32.length !== 32) throw new Error("proofHash must be 32 bytes");

  const variant = Buffer.from([0]); // 0 = UpsertProof
  const claimPart = borshString(claimId);
  const noncePart = u64LE(nonce);
  const hashPart = Buffer.from(proofHash32);
  const uriPart = borshString(uri);

  return Buffer.concat([variant, claimPart, noncePart, hashPart, uriPart]);
}

function deriveProofPda(programId: PublicKey, claimId: string, authority: PublicKey, nonce: number) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("proof"),
      Buffer.from(claimId, "utf8"),
      authority.toBuffer(),
      u64ToLESeed(nonce),
    ],
    programId
  );
  return pda;
}

async function sha256BytesUtf8(text: string): Promise<Uint8Array> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    Buffer.from(text, "utf8")
  );
  return new Uint8Array(digest);
}

async function connectPhantom(): Promise<PublicKey> {
  if (!window.solana?.isPhantom) throw new Error("Phantom not found. Install Phantom.");
  const res = await window.solana.connect();
  return new PublicKey(res.publicKey.toString());
}

export default function SubmitClaimPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const carId = sp.get("carId") || "";

  const [category, setCategory] = useState<ClaimCategory>("reliability");
  const [statement, setStatement] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [contribType, setContribType] = useState<ContributorType>("owner");
  const [displayName, setDisplayName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const invalidCarId = useMemo(() => carId.length !== 24, [carId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (invalidCarId) {
      setErr("Invalid carId. Click “Submit claim” from a car page.");
      return;
    }

    setSubmitting(true);

    try {
      setStatus("Submitting claim (off-chain)...");
      const r = await api.createClaim({
        carId,
        category,
        statement,
        evidenceSummary,
        evidenceUrl: "",
        contributor: { type: contribType, displayName },
      });

      const claimId = r.claimId;
      const canonical = r.canonical;

      setStatus("Connecting Phantom...");
      const authority = await connectPhantom();

      setStatus("Getting next nonce...");
      const { nonce } = await api.getNextNonce({
        claimId,
        wallet: authority.toBase58(),
      });

      // IMPORTANT: must match verify logic
      const payload = `${canonical}${authority.toBase58()}${nonce}`;
      setStatus("Hashing + sending Solana tx...");
      const proofHash = await sha256BytesUtf8(payload);

      const proofPda = deriveProofPda(PROGRAM_ID, claimId, authority, nonce);
      const ixData = encodeUpsertProofIx(claimId, nonce, proofHash, "carify://claim");

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: authority, isSigner: true, isWritable: true },
          { pubkey: proofPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: ixData,
      });

      const connection = new Connection(RPC_URL, "confirmed");
      const tx = new Transaction().add(ix);
      tx.feePayer = authority;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await window.solana.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      setStatus("Saving Solana receipt...");
      await api.saveSolanaReceipt({
        claimId,
        programId: PROGRAM_ID.toBase58(),
        proofPda: proofPda.toBase58(),
        txSignature: sig,
        nonce,
        wallet: authority.toBase58(),
      });

      setStatus(null);

      // Go back to car page (you’ll see the claim)
      router.push(`/cars/${carId}`);
    } catch (e: any) {
      setStatus(null);
      setErr(e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <a href="/" className="text-sm text-neutral-400 hover:text-white">
        ← Back
      </a>

      <div>
        <h1 className="text-2xl font-semibold">Submit a claim</h1>
        <p className="mt-2 text-sm text-neutral-300 max-w-2xl">
          Claim stored off-chain, then anchored to Solana via PDA hash.
        </p>
      </div>

      <div className="text-sm text-neutral-400">
        Car ID: <span className="font-mono text-neutral-200">{carId || "(missing)"}</span>
      </div>

      {invalidCarId ? (
        <div className="text-sm text-red-400">
          Invalid carId. Click “Submit claim” from a car page.
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
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

          <label className="space-y-2">
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
        </div>

        <label className="space-y-2 block">
          <div className="text-xs text-neutral-400">Claim statement</div>
          <textarea
            className="w-full min-h-[88px] rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2 block">
          <div className="text-xs text-neutral-400">Evidence summary</div>
          <textarea
            className="w-full min-h-[88px] rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={evidenceSummary}
            onChange={(e) => setEvidenceSummary(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2 block">
          <div className="text-xs text-neutral-400">Display name</div>
          <input
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>

        <button
          disabled={submitting || invalidCarId}
          className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
          type="submit"
        >
          {submitting ? "Submitting..." : "Submit claim"}
        </button>

        {status && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200">
            {status}
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
