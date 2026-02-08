import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
console.log("GEMINI KEY LOADED:", !!process.env.GEMINI_API_KEY);

const EvalSchema = z.object({
  proofQuality: z.number().min(0).max(1),
  status: z.enum(["verified", "needs_more_evidence", "unverified"]),
  summary: z.string(),
  reasons: z.array(z.string()).max(8),
  missingEvidence: z.array(z.string()).max(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? "");
    const evidenceUrls: string[] = Array.isArray(body?.evidenceUrls)
      ? body.evidenceUrls.map(String)
      : [];

    if (!text.trim()) {
      return Response.json({ error: "Missing text" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `
Return ONLY valid JSON matching this schema exactly:
{
  "proofQuality": number (0..1),
  "status": "verified" | "needs_more_evidence" | "unverified",
  "summary": string,
  "reasons": string[],
  "missingEvidence": string[]
}

Inputs:
- claim text: ${text}
- evidence URLs (may be empty): ${evidenceUrls.join(", ")}

Rules:
- If there are no evidence URLs, proofQuality MUST be <= 0.45 and status MUST NOT be "verified".
- Be conservative. Prefer "needs_more_evidence" unless evidence clearly supports the claim.
- reasons: up to 8 bullets
- missingEvidence: up to 8 bullets
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    // genai sometimes returns fenced json; strip if needed
    const raw = response.text.trim().replace(/^```json\s*|```$/g, "");
    const parsed = EvalSchema.parse(JSON.parse(raw));

    return Response.json(parsed);
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Gemini eval failed" },
      { status: 500 }
    );
  }
}
