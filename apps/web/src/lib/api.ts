const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Car = {
  carId: string;
  make: string;
  model: string;
  year: number;
  imageUrl?: string;
};

export type Claim = {
  _id?: string;
  carId: string;
  category: "reliability" | "ownership_cost" | "comfort" | "efficiency" | "safety";
  statement: string;
  evidenceSummary: string;
  evidenceUrl?: string;
  evidence?: { samples?: number; avgMileageKm?: number };
  contributor: { type: "owner" | "mechanic" | "expert"; displayName: string; wallet?: string };
  createdAt?: string;
  proof?: { hash: string; solanaTx?: string };
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/uploads`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  const data = (await res.json()) as { url: string };
  return data.url; // "/uploads/xxx.jpg"
}

async function createClaim(payload: Omit<Claim, "createdAt">) {
  return apiFetch<{ claim: Claim; proof: { hash: string; solanaTx?: string } }>(
    `/cars/${payload.carId}/claims`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export const api = {
  listCars: () => apiFetch<{ cars: Car[] }>("/cars"),
  getClaims: (carId: string) => apiFetch<{ claims: Claim[] }>(`/cars/${carId}/claims`),
  explain: (carId: string) => apiFetch<{ explanation: string }>(`/cars/${carId}/explain`),

  uploadImage,
  createClaim,
};
