# Architecture

Technical patterns and decisions for `aleph-sdk-ts`.

---

## Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (ESM + CJS dual output) |
| Build | Rollup via Lerna monorepo |
| Test | Jest |
| Lint/Format | Prettier |
| Package Manager | npm (workspaces) |
| CI | GitHub Actions |

---

## Project Structure

```
packages/
  account/       # Account abstraction (sign, address, chain)
  client/        # HTTP + authenticated HTTP + VM client
  core/          # Shared types (Blockchain enum, etc.)
  ethereum/      # ETH account implementation
  solana/        # SOL account implementation
  avalanche/     # AVAX account
  base/          # Base account
  cosmos/        # Cosmos account
  dns/           # DNS utilities
  ethereum-ledger/ # Ledger hardware wallet
  evm/           # Generic EVM account
  message/       # Aleph message types
  nuls2/         # NULS2 account
  substrate/     # Substrate account
  superfluid/    # Superfluid integration
  tezos/         # Tezos account
docs/
  plans/         # Design docs and implementation plans
  ARCHITECTURE.md
  BACKLOG.md
  DECISIONS.md
```

---

## Patterns

### Account Abstraction
**Context:** SDK supports multiple blockchains with different signing schemes.
**Approach:** All chains implement the `Account` interface from `@aleph-sdk/account` which provides `address`, `getChain()`, and `sign(signable)`. The `SignableMessage` interface uses `getVerificationBuffer(): Buffer` for chain-specific message formatting.
**Key files:** `packages/account/src/`
**Notes:** `Buffer` usage is forced by the `SignableMessage` interface — this is an upstream constraint. Browser bundlers (webpack, vite) typically polyfill Buffer.

### VmClient CRN Authentication
**Context:** CRN (Compute Resource Node) instances require a two-layer auth scheme.
**Approach:** Two headers per request:
1. `X-SignedPubKey` — ephemeral P-256 key signed by wallet (24h TTL, cached)
2. `X-SignedOperation` — per-request ES256 signature by ephemeral key

Uses Web Crypto API (`crypto.subtle`) for browser + Node.js 15+ compatibility. Static factory `VmClient.create()` because `crypto.subtle.generateKey` is async.

**Key files:** `packages/client/src/vmClient.ts`, `packages/client/src/utils/hex.ts`
**Notes:**
- Domain field must be hostname only (not full URL) — CRN validates `domain == settings.DOMAIN_NAME`
- All non-SOL chains normalize to `'ETH'` in the chain field
- ETH signs raw JSON bytes; SOL signs hex-encoded payload string as UTF-8 bytes
- SOL signatures are base58, converted to 0x-prefixed hex for the header

### Hex Utilities (Browser-Safe)
**Context:** `Buffer.from(...).toString('hex')` is Node.js specific.
**Approach:** Minimal `Uint8Array`-based hex encoding in `packages/client/src/utils/hex.ts`. Four functions: `bytesToHex`, `hexToBytes`, `utf8ToBytes`, `bytesToUtf8`.
**Key files:** `packages/client/src/utils/hex.ts`
**Notes:** Only `bytesToHex` and `utf8ToBytes` are used by production code. `hexToBytes` and `bytesToUtf8` are test utilities for decoding payloads in assertions.

---

## Recipes

### Adding a New VmClient Operation
1. Add the operation to `VmOperation` enum if it maps to a CRN endpoint
2. Add a method that calls `this.performOperation(vmId, VmOperation.X, options)` or uses `this.buildAuthHeaders(path, method)` for custom paths
3. Add tests in `packages/client/__tests__/vmClient.test.ts` verifying URL, method, headers, and params
4. Run `npx jest packages/client/__tests__/` to verify

### Running Client Tests
```bash
npx jest packages/client/__tests__/ --no-cache
```

### Full Monorepo Build
```bash
npm run build
```

### Lint Check
```bash
npx prettier --check packages/client/src/ packages/client/__tests__/
```
