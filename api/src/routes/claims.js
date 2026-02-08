// api/src/routes/claims.js
import { Router } from "express";
import crypto from "crypto";
import { Claim } from "../models/Claim.js";

const router = Router();

function sha256Hex(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function normalizeAttachments(att) {
  const arr = Array.isArray(att) ? att : [];
  // keep only safe fields + stable order
  const norm = arr
    .map((a) => ({
      url: String(a?.url || "").trim(),
      originalName: String(a?.originalName || "").trim(),
      mimeType: String(a?.mimeType || "").trim(),
      size: Number(a?.size || 0),
    }))
    .filter((a) => a.url.length > 0)
    .sort((a, b) => a.url.localeCompare(b.url));
  return norm;
}

function canonicalize(input) {
  const attachments = normalizeAttachments(input.attachments);

  const obj = {
    carId: String(input.carId || "").trim(),
    category: String(input.category || "").trim(),
    statement: String(input.statement || "").trim(),
    evidenceSummary: String(input.evidenceSummary || "").trim(),
    evidenceUrl: String(input.evidenceUrl || "").trim(),
    attachments,
    contributorType: String(input.contributor?.type || "").trim(),
    contributorDisplayName: String(input.contributor?.displayName || "").trim(),
    contributorWallet: String(input.contributor?.wallet || "").trim(),
  };
  return JSON.stringify(obj);
}

// POST /claims
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.carId) return res.status(400).json({ error: "carId is required" });
    if (!body.category) return res.status(400).json({ error: "category is required" });
    if (!body.statement) return res.status(400).json({ error: "statement is required" });
    if (!body.evidenceSummary)
      return res.status(400).json({ error: "evidenceSummary is required" });
    if (!body.contributor?.type)
      return res.status(400).json({ error: "contributor.type is required" });
    if (!body.contributor?.displayName)
      return res.status(400).json({ error: "contributor.displayName is required" });

    const attachments = normalizeAttachments(body.attachments);
    const canonical = canonicalize({ ...body, attachments });
    const hash = sha256Hex(canonical);

    const claim = await Claim.create({
      carId: String(body.carId),
      category: String(body.category),
      statement: String(body.statement),
      evidenceSummary: String(body.evidenceSummary),
      evidenceUrl: String(body.evidenceUrl || ""),
      attachments,
      contributor: {
        type: String(body.contributor.type),
        displayName: String(body.contributor.displayName),
        wallet: String(body.contributor.wallet || ""),
      },
      canonical,
      proof: { hash },
    });

    res.status(201).json({
      claimId: String(claim._id),
      canonical,
      proof: { hash },
      solana: claim.solana || null,
    });
  } catch (err) {
    console.error("POST /claims failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /claims/:claimId/proofs/next-nonce?wallet=...
router.get("/:claimId/proofs/next-nonce", async (req, res) => {
  try {
    const claimId = String(req.params.claimId);
    const wallet = String(req.query.wallet || "").trim();
    if (!wallet) return res.status(400).json({ error: "wallet is required" });

    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ error: "claim not found" });

    const current = Number(claim.nonces?.get(wallet) || 0);
    res.json({ nonce: current + 1 });
  } catch (err) {
    console.error("GET next nonce failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /claims/:claimId/solana
router.post("/:claimId/solana", async (req, res) => {
  try {
    const claimId = String(req.params.claimId);
    const { programId, proofPda, txSignature, nonce, wallet } = req.body || {};

    if (!programId) return res.status(400).json({ error: "programId is required" });
    if (!txSignature) return res.status(400).json({ error: "txSignature is required" });
    if (!wallet) return res.status(400).json({ error: "wallet is required" });
    if (!nonce) return res.status(400).json({ error: "nonce is required" });

    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ error: "claim not found" });

    const current = Number(claim.nonces?.get(String(wallet)) || 0);
    const incoming = Number(nonce);
    if (incoming <= current) {
      return res.status(400).json({ error: "nonce must increase" });
    }

    claim.solana = {
      programId: String(programId),
      proofPda: String(proofPda || ""),
      txSignature: String(txSignature),
      nonce: incoming,
      wallet: String(wallet),
    };

    claim.nonces.set(String(wallet), incoming);
    await claim.save();

    res.json({ ok: true, solana: claim.solana });
  } catch (err) {
    console.error("POST /claims/:id/solana failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
