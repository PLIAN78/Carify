import { Router } from "express";
import crypto from "crypto";
import { Claim } from "../models/Claim.js";

const router = Router();

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// POST /claims
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    // Basic validation
    const required = ["carId", "category", "statement", "evidenceSummary", "contributor"];
    for (const k of required) {
      if (!body?.[k]) return res.status(400).json({ error: `${k} is required` });
    }
    if (!body.contributor?.type || !body.contributor?.displayName) {
      return res.status(400).json({ error: "contributor.type and contributor.displayName are required" });
    }

    // Create claim first (without proof)
    const doc = await Claim.create({
      carId: body.carId,
      category: body.category,
      statement: body.statement,
      evidenceSummary: body.evidenceSummary,
      evidence: body.evidence,
      contributor: body.contributor,
      evidenceUrl: typeof body.evidenceUrl === "string" ? body.evidenceUrl : "",
    });

    // Create a stable proof hash placeholder (later you’ll anchor this on Solana)
    const canonical = JSON.stringify({
      carId: doc.carId,
      category: doc.category,
      statement: doc.statement,
      evidenceSummary: doc.evidenceSummary,
      evidence: doc.evidence ?? null,
      contributor: doc.contributor,
      createdAt: doc.createdAt,
      id: String(doc._id),
      
    });

    const proof = { hash: sha256(canonical) };

    doc.proof = proof;
    await doc.save();

    res.status(201).json({ claimId: String(doc._id), proof });
  } catch (err) {
    console.error("POST /claims failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
