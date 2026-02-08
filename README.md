## Inspiration
(This is a solo project, building from my own inspo) 
Buying a car is way more confusing than it should be. Prices are influenced by brand bias, dealership incentives, fake reviews, and vague "trust scores" that don't really explain why a car is considered good or bad. As users and builders, we wanted a way to evaluate cars based on transparent, community-backed signals instead of opaque ratings or centralized platforms.

That idea turned into **Carify** — a system focused on trust, evidence, and accountability around car reputation.

## What it does

Carify is a car reputation and trust platform that allows users to:

- Search and explore cars without brand-driven bias
- Submit claims, reviews, and supporting evidence tied to specific vehicles
- Build a reputation layer around cars using aggregated user contributions
- See how a car's trust score evolves over time based on verified activity

Instead of a single rating, Carify focuses on *why* a car is trusted (user provides evidence).

## How we built it

We split the project into a clean frontend–backend workflow.

- **Frontend:** A simple, fast web interface for searching cars, viewing reputation data, and submitting claims
- **Backend:** REST APIs built with Node.js and Express to handle car data, reviews, claims, and evidence uploads
- **Database:** MongoDB for flexible schema design around cars, claims, and reputation signals
- **Architecture:** Designed around future extensibility for ranking algorithms and aggregation logic

The backend was structured to support future Web3 or decentralized trust extensions, even though the MVP stays lightweight.

## Challenges we ran into

- Designing a reputation system that doesn't collapse into a single meaningless score
- Handling schema evolution while iterating fast during a hackathon
- Avoiding over-engineering while still planning for long-term scalability
- Debugging deployment and environment mismatches under time pressure

A lot of time went into deciding what *not* to build.

(Also somehow had 2 front-end folders )

## Accomplishments that we're proud of

- A working end-to-end product that actually solves a real trust problem
- A backend architecture that's clean, readable, and extensible
- Successfully implementing claims + evidence instead of shallow reviews
- Keeping the scope realistic while still ambitious

Most importantly: **we shipped something usable.**

Also gained experience with Solana!

## What we learned

- Trust systems are harder than they look — simplicity matters
- Clear API contracts save hours of frontend–backend pain
- Hackathons reward execution more than perfection
- Designing for transparency changes how you think about data

## What's next for Carify

- Implementing reputation aggregation and ranking logic
- Adding user credibility weighting over time
- Improving visualization of trust signals and trends
- Exploring decentralized identity or on-chain verification for claims
