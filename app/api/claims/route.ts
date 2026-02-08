import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();

  const carId = String(body?.carId ?? "");
  const text = String(body?.text ?? "");
  const authorWallet =
    body?.authorWallet === undefined ? undefined : String(body.authorWallet);

  const evidenceUrls: string[] = Array.isArray(body?.evidenceUrls)
    ? body.evidenceUrls.map(String).filter(Boolean)
    : [];

  if (!carId || !text.trim()) {
    return Response.json({ error: "Missing carId or text" }, { status: 400 });
  }

  // 1) create claim first (so user gets an id even if Gemini fails)
  const claim = await prisma.claim.create({
    data: {
      carId,
      text,
      authorWallet,
      evidenceUrls: JSON.stringify(evidenceUrls),
      status: "unverified",
      proofQuality: 0,
    },
  });

  // 2) call Gemini evaluator
  try {
    const res = await fetch(new URL("/api/gemini-evaluate", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, evidenceUrls }),
    });

    const evalJson = await res.json();
    if (!res.ok) throw new Error(evalJson?.error ?? "Eval failed");

    // 3) update claim with eval result
    const updated = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        proofQuality: evalJson.proofQuality,
        status: evalJson.status,
        geminiJson: JSON.stringify(evalJson),
      },
    });

    return Response.json({ claim: updated, evaluation: evalJson });
  } catch (e: any) {
    // still return the created claim even if eval failed
    return Response.json({
      claim,
      evaluationError: e?.message ?? "Gemini evaluation failed",
    });
  }
}

// Optional: list claims by carId
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const carId = (searchParams.get("carId") || "").trim();
  if (!carId) return Response.json({ claims: [] });

  const claims = await prisma.claim.findMany({
    where: { carId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ claims });
}
