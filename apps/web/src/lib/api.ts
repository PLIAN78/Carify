// web/src/lib/api.ts

export type ClaimCategory =
  | "reliability"
  | "ownership_cost"
  | "comfort"
  | "efficiency"
  | "safety";

export type ContributorType = "owner" | "mechanic" | "expert";

export type Car = {
  _id: string;
  make: string;
  model: string;
  year: number;
  imageUrl?: string;
};

export type Claim = {
  _id: string;
  carId: string;
  category: ClaimCategory;
  statement: string;
  evidenceSummary: string;
  evidenceUrl?: string;
  contributor: {
    type: ContributorType;
    displayName: string;
    wallet?: string;
  };
  canonical?: string;
  proof?: { hash: string };
  solana?: {
    programId: string;
    proofPda: string;
    txSignature: string;
    nonce: number;
    wallet: string;
  };
  createdAt: string;
};

export type CreateClaimInput = {
  carId: string;
  category: ClaimCategory;
  statement: string;
  evidenceSummary: string;
  evidenceUrl?: string;
  contributor: {
    type: ContributorType;
    displayName: string;
    wallet?: string;
  };
};

export type CreateClaimResponse = {
  claimId: string;
  canonical: string;
  proof: { hash: string };
  solana?: Claim["solana"] | null;
};

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.headers || {}),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || url}`);
  }

  return (await res.json()) as T;
}

export const api = {
  baseUrl,

  async listCars(): Promise<{ cars: Car[] }> {
    return fetchJson<{ cars: Car[] }>("/cars");
  },

  async getCar(carId: string): Promise<{ car: Car }> {
    return fetchJson<{ car: Car }>(`/cars/${encodeURIComponent(carId)}`);
  },

  async getClaimsForCar(carId: string): Promise<{ claims: Claim[] }> {
    return fetchJson<{ claims: Claim[] }>(
      `/cars/${encodeURIComponent(carId)}/claims`,
      { method: "GET" }
    );
  },

  async createClaim(input: CreateClaimInput): Promise<CreateClaimResponse> {
    return fetchJson<CreateClaimResponse>("/claims", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getNextNonce(params: {
    claimId: string;
    wallet: string;
  }): Promise<{ nonce: number }> {
    const { claimId, wallet } = params;
    return fetchJson<{ nonce: number }>(
      `/claims/${encodeURIComponent(
        claimId
      )}/proofs/next-nonce?wallet=${encodeURIComponent(wallet)}`,
      { method: "GET" }
    );
  },

  async saveSolanaReceipt(params: {
    claimId: string;
    programId: string;
    proofPda: string;
    txSignature: string;
    nonce: number;
    wallet: string;
  }): Promise<{ ok: true; solana?: any }> {
    const { claimId, ...receipt } = params;
    return fetchJson<{ ok: true; solana?: any }>(
      `/claims/${encodeURIComponent(claimId)}/solana`,
      {
        method: "POST",
        body: JSON.stringify(receipt),
      }
    );
  },

  async explainCar(carId: string): Promise<{ explanation: string }> {
    return fetchJson<{ explanation: string }>(
      `/cars/${encodeURIComponent(carId)}/explain`,
      { method: "GET" }
    );
  },
};
