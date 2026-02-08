"use client";

import { useState } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { api } from "@/lib/api";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

type Props = {
  claim: {
    _id: string;
    proof?: { hash?: string };
    solana?: {
      txSignature?: string;
    };
  };
};

declare global {
  interface Window {
    solana?: any;
  }
}

export default function AnchorProofButton({ claim }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function ensureWallet(): Promise<PublicKey> {
    if (!window.solana?.isPhantom) {
      throw new Error("Phantom not found. Install Phantom to anchor on Solana.");
    }
    const resp = await window.solana.connect();
    return new PublicKey(resp.publicKey.toString());
  }

  async function onAnchor() {
    setMsg("");
    const hash = claim.proof?.hash;
    if (!hash) {
      setMsg("No proof hash on this claim yet.");
      return;
    }

    setBusy(true);
    try {
      const rpc =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
      const connection = new Connection(rpc, "confirmed");
      const payer = await ensureWallet();
      const walletStr = payer.toString();

      // ask backend for next nonce (per-wallet)
      const { nonce } = await api.getNextNonce({ claimId: claim._id, wallet: walletStr });

      // memo content: deterministic + verifiable
      const memoText = `autotrust|claim=${claim._id}|hash=${hash}|nonce=${nonce}`;

      const ix = new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(memoText, "utf-8"),
      });

      const tx = new Transaction().add(ix);
      tx.feePayer = payer;
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash;

      // sign+send through Phantom
      const signed = await window.solana.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
      });
      await connection.confirmTransaction(sig, "confirmed");

      // store receipt in backend
      await api.saveSolanaReceipt({
        claimId: claim._id,
        programId: MEMO_PROGRAM_ID.toString(),
        proofPda: "", // memo approach doesn't use PDAs
        txSignature: sig,
        nonce,
        wallet: walletStr,
      });

      setMsg(`Anchored ✓ ${sig}`);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to anchor");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onAnchor}
        disabled={busy}
        className="px-3 py-2 text-xs rounded-lg border border-neutral-800 hover:bg-neutral-900 disabled:opacity-50"
      >
        {busy ? "Anchoring…" : claim.solana?.txSignature ? "Re-anchor" : "Anchor on Solana"}
      </button>
      {msg ? <div className="text-xs text-neutral-400 break-all">{msg}</div> : null}
    </div>
  );
}
