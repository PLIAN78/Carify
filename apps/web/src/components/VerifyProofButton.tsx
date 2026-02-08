"use client";

import { useState } from "react";
import { Connection } from "@solana/web3.js";

export type VerifyState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "verified" }
  | { status: "invalid"; reason: string };

export type ClaimForVerify = {
  _id: string;
  proof?: { hash?: string };
  solana?: {
    txSignature?: string;
    wallet?: string;
    nonce?: number;
  };
};

function extractMemoTexts(tx: any): string[] {
  const out: string[] = [];
  const ixs = tx?.transaction?.message?.instructions || [];
  for (const ix of ixs) {
    const data = ix?.data;
    if (typeof data === "string") {
      try {
        out.push(Buffer.from(data, "base64").toString("utf-8"));
      } catch {
        // ignore
      }
    }
  }
  return out;
}

/**
 * Reusable verifier:
 * - fetch tx by signature
 * - decode memo instructions
 * - ensure memo contains claimId + hash (+ nonce if present)
 */
export async function verifyClaimOnSolana(claim: ClaimForVerify): Promise<VerifyState> {
  const sig = claim.solana?.txSignature;
  const hash = claim.proof?.hash;

  if (!sig) return { status: "invalid", reason: "No on-chain proof yet" };
  if (!hash) return { status: "invalid", reason: "Missing local proof hash" };

  const rpc =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  const tx = await connection.getTransaction(sig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) return { status: "invalid", reason: "Transaction not found on RPC" };

  const memos = extractMemoTexts(tx);

  const mustHaveClaim = `claim=${claim._id}`;
  const mustHaveHash = `hash=${hash}`;

  const hasBasics = memos.some((m) => m.includes(mustHaveClaim) && m.includes(mustHaveHash));
  if (!hasBasics) {
    return {
      status: "invalid",
      reason: "Memo mismatch: claimId/hash not found in transaction memo",
    };
  }

  const expectedNonce = claim.solana?.nonce;
  if (expectedNonce != null) {
    const mustHaveNonce = `nonce=${expectedNonce}`;
    const hasNonce = memos.some((m) => m.includes(mustHaveNonce));
    if (!hasNonce) {
      return {
        status: "invalid",
        reason: "Memo mismatch: nonce not found in transaction memo",
      };
    }
  }

  return { status: "verified" };
}

type Props = {
  claim: ClaimForVerify;
  onStatus?: (state: VerifyState) => void;
};

export default function VerifyProofButton({ claim, onStatus }: Props) {
  const [state, setState] = useState<VerifyState>({ status: "idle" });

  async function onVerify() {
    const pending: VerifyState = { status: "pending" };
    setState(pending);
    onStatus?.(pending);

    try {
      const result = await verifyClaimOnSolana(claim);
      setState(result);
      onStatus?.(result);
    } catch (e: any) {
      const bad: VerifyState = {
        status: "invalid",
        reason: e?.message ?? "Verify failed",
      };
      setState(bad);
      onStatus?.(bad);
    }
  }

  return (
    <button
      onClick={onVerify}
      disabled={state.status === "pending"}
      className="px-3 py-2 text-xs rounded-lg border border-neutral-800 hover:bg-neutral-900 disabled:opacity-50"
      title={state.status === "invalid" ? state.reason : ""}
    >
      {state.status === "idle" && "Verify proof"}
      {state.status === "pending" && "Verifying…"}
      {state.status === "verified" && "Verified ✓"}
      {state.status === "invalid" && "Invalid"}
    </button>
  );
}
