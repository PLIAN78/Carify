# Carify

Worst vibe-coded project I’ve ever made.  
Never doing TypeScript again (lying, but still mad).

Carify started as an idea to track car reputation and value **without external bias** — no brands pushing narratives, no dealerships cherry-picking reviews, no sponsored rankings pretending to be “objective”.

Instead of opinions, Carify focuses on **claims with evidence**.

Users submit claims about cars (reliability, cost, safety, efficiency, etc.), attach supporting evidence, and those claims are:
- stored off-chain  
- anchored with cryptographic hashes  
- designed to be auditable instead of persuasive  

The goal isn’t to tell you *what to buy*.  
It’s to let you inspect **what people are actually claiming**, where it came from, and whether it’s backed by anything real.

---

## What this project does

- Lists cars by make, model, and year  
- Allows users to submit claims tied to a specific car  
- Supports evidence uploads (images/docs)  
- Anchors claims with proof hashes (Solana integration planned / stubbed)  
- Separates reputation from marketing  

No star ratings.  
No paid boosts.  
No “top 10 cars you must buy”.

---

## Tech stack (for better or worse)

- Next.js (App Router)  
- TypeScript (regrettably)  
- Express + MongoDB  
- File uploads served from the backend  
- Web3-style proof anchoring (early stage)  

Frontend and backend live in a monorepo because chaos builds character.

---

# Hackathon stuff

Carify is an experiment in building car reputation without marketing bias.

Most car rankings are influenced by brands, dealerships, or sponsored narratives. Carify flips that model by treating reputation as a collection of verifiable claims instead of opinions.

Each claim is tied to evidence, stored off-chain, and anchored with a cryptographic proof hash. Rather than asking users to trust a score, the system lets them inspect what was claimed, who claimed it, and what proof exists.

The goal is not to recommend cars, but to make reputation auditable.

---

## What Carify does

- Lists cars by make, model, and year
- Allows users to submit claims tied to a specific car
- Supports evidence uploads (images or documents)
- Anchors claims with cryptographic proof hashes
- Separates reputation from brand influence and sponsored content

There are no star ratings, paid boosts, or hidden weighting systems.

---

## Technical overview

- Next.js (App Router) frontend
- Express + MongoDB backend
- Evidence uploads served from the backend
- Cryptographic proof anchoring (Solana integration stubbed)

Frontend and backend are managed in a single monorepo.

---

## Architecture

/apps/web        → frontend (Next.js)
/api             → backend (Express, MongoDB)
/uploads         → stored evidence files

---

## Running locally

Backend:

cd api  
npm install  
npm run dev  

Frontend:

cd apps/web  
npm install  
npm run dev  

Environment variable:

NEXT_PUBLIC_API_URL=http://localhost:4000

---

## Why this matters

Carify explores how reputation systems can be built around verifiability instead of persuasion.

The same structure can apply to products, services, or any domain where trust is currently shaped by incentives rather than evidence.

---

## Status

Prototype built during a hackathon.  
Actively iterated, intentionally opinionated, and designed to be extended.


