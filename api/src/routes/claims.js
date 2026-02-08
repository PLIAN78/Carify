import { Router } from "express";
import crypto from "crypto";
import { Claim } from "../models/Claim.js";

const router = Router();

function sha256Hex(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function buildCanonical(doc) {
  return JSON.stringify({
    app: "carify",
    id: String(doc._id),
    carId: doc.carId,
    category: doc.category,
    statement: doc.statement,
    evidenceSummary: doc.evidenceSummary,
    evidenceUrl: doc.evidenceUrl ?? "",
    contributor: doc.contributor,
    createdAt: doc.createdAt,
  });
}

// POST /claims
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    const required = ["carId", "category", "statement", "evidenceSummary", "contributor"];
    for (const k of required) {
      if (!body?.[k]) return res.status(400).json({ error: `${k} is required` });
    }
    if (!body.contributor?.type || !body.contributor?.displayName) {
      return res.status(400).json({ error: "contributor.type and contributor.displayName are required" });
    }

    const doc = await Claim.create({
      carId: body.carId,
      category: body.category,
      statement: body.statement,
      evidenceSummary: body.evidenceSummary,
      evidenceUrl: typeof body.evidenceUrl === "string" ? body.evidenceUrl : "",
      contributor: body.contributor,
    });

    const canonical = buildCanonical(doc);
    const proof = { hash: sha256Hex(canonical) };

    doc.canonical = canonical;
    doc.proof = proof;
    await doc.save();

    res.status(201).json({
      claimId: String(doc._id),
      canonical,
      proof,
      solana: doc.solana ?? null,
    });
  } catch (err) {
    console.error("POST /claims failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /claims/:claimId/proofs/next-nonce?wallet=...
router.get("/:claimId/proofs/next-nonce", async (req, res) => {
  try {
    const { claimId } = req.params;
    const wallet = String(req.query.wallet || "");
    if (!wallet) return res.status(400).json({ error: "wallet is required" });

    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ error: "claim not found" });

    // hackathon-simple: 0 if no receipt, else 1
    const nonce = claim.solana?.txSignature ? 1 : 0;
    res.json({ nonce });
  } catch (err) {
    console.error("GET next-nonce failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /claims/:claimId/solana
router.post("/:claimId/solana", async (req, res) => {
  try {
    const { claimId } = req.params;
    const { programId, proofPda, txSignature, nonce, wallet } = req.body || {};

    const required = ["programId", "proofPda", "txSignature", "nonce", "wallet"];
    for (const k of required) {
      if (req.body?.[k] === undefined || req.body?.[k] === null || req.body?.[k] === "") {
        return res.status(400).json({ error: `${k} is required` });
      }
    }

    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ error: "claim not found" });

    claim.solana = { programId, proofPda, txSignature, nonce, wallet };
    await claim.save();

    res.json({ ok: true, solana: claim.solana });
  } catch (err) {
    console.error("POST /claims/:claimId/solana failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
