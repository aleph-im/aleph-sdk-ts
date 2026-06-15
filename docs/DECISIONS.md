# Decisions Log

Key decisions made during development. When you wonder "why did we do X?", the answer should be here.

---

## How Decisions Are Logged

Decisions are captured when these phrases appear:
- "decided" / "let's go with" / "rejected"
- "choosing X because" / "not doing X because"
- "actually, let's" / "changed my mind"

Each entry includes:
- Context (what we were working on)
- Decision (what was chosen)
- Rationale (why - the most important part)

---

## Decision #3 - 2026-02-26
**Context:** VmClient implementation — how to handle SOL signature format
**Decision:** Convert SOL base58 signatures to 0x-prefixed hex inline, using a minimal base58Decode implementation rather than importing `bs58`
**Rationale:** `bs58` is available in `packages/solana` but adding a cross-package dependency for one function increases coupling. The base58 decoder is ~30 lines and only used for SOL signature conversion. Keeps the client package browser-bundle-friendly with no extra dependencies.
**Alternatives considered:** Import `bs58` from solana package; add `bs58` as direct dependency to client package

## Decision #2 - 2026-02-26
**Context:** VmClient implementation — CRN domain field
**Decision:** Use `new URL(nodeUrl).hostname` for the `domain` field in all auth payloads
**Rationale:** The CRN server validates `domain == settings.DOMAIN_NAME` where `DOMAIN_NAME` is the hostname (e.g., `crn.example.com`), not the full URL. Using the full URL would cause auth rejection. The `nodeDomain` getter centralizes this.

## Decision #1 - 2026-02-26
**Context:** Making VmClient work in browsers — choosing crypto approach
**Decision:** Use Web Crypto API (`crypto.subtle`) exclusively, no `node:crypto`
**Rationale:** Web Crypto API is available in all modern browsers and Node.js 15+ (SDK targets Node 20+). A single code path avoids conditional logic and testing complexity. The only async change is key generation, handled cleanly by a static factory pattern.
**Alternatives considered:**
- Conditional `node:crypto` / `crypto.subtle` — two code paths, more complexity, marginal perf gain not worth it
- Injectable CryptoProvider interface — over-engineered for exactly two operations (keygen + sign)
