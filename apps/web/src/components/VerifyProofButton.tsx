// web/src/components/VerifyProofButton.tsx
"use client";

import { useState } from "react";

type VerifyState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "verified" }
  | { status: "invalid"; reason: string };

type Props = {
  claim: {
    _id: string;
    solana?: {
      proofPda?: string;
    };
  };
  rpcUrl?: string;
  onStatus?: (state: VerifyState) => void;
};

export default function VerifyProofButton({ claim, onStatus }: Props) {
  const [state, setState] = useState<VerifyState>({ status: "idle" });

  function onVerify() {
    if (!claim.solana?.proofPda) {
      const s = { status: "invalid", reason: "No on-chain proof yet" } as const;
      setState(s);
      onStatus?.(s);
      return;
    }

    // 🔥 Hackathon stub — assume valid
    const pending = { status: "pending" } as const;
    setState(pending);
    onStatus?.(pending);

    setTimeout(() => {
      const ok = { status: "verified" } as const;
      setState(ok);
      onStatus?.(ok);
    }, 600);
  }

  return (
    <button
      onClick={onVerify}
      disabled={state.status === "pending"}
      className="px-3 py-2 text-xs rounded-lg border hover:bg-gray-50 disabled:opacity-50"
    >
      {state.status === "idle" && "Verify proof"}
      {state.status === "pending" && "Verifying…"}
      {state.status === "verified" && "Verified ✓"}
      {state.status === "invalid" && "Invalid"}
    </button>
  );
}
