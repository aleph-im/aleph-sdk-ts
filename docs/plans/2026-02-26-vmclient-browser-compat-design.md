# VmClient Browser Compatibility & Front-End Migration

Date: 2026-02-26

## Problem

PR #202 adds a `VmClient` class to `@aleph-sdk/client` for CRN instance management, but it uses `node:crypto` which only works in Node.js. The front-end (`front-aleph-cloud-page`) has its own duplicated implementation of the same auth scheme in `ExecutableManager`. We need the SDK's VmClient to work in browsers so the front-end can replace its duplicated code.

## Scope

SDK VmClient handles **CRN control plane only**:

| In scope | Out of scope (stays in front-end) |
|---|---|
| VM lifecycle (stop/reboot/erase/expire) | PAYG stream management |
| Backup/restore/reinstall | SSH key management |
| Log streaming (WebSocket) | Domain management |
| CRN resource reservation | Cost estimation |
| Allocation notify (start) | Checkout flow orchestration |
| Status checking | |

## Approach: Web Crypto API only

Replace all `node:crypto` usage with `crypto.subtle`. The Web Crypto API is available in all modern browsers and Node.js 15+. The SDK targets Node 20+, so this works everywhere with zero conditional logic.

| Current (node:crypto) | New (Web Crypto API) |
|---|---|
| `generateKeyPairSync('ec', ...)` | `crypto.subtle.generateKey(...)` |
| `sign('SHA256', payload, { key, dsaEncoding: 'ieee-p1363' })` | `crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, payload)` |
| `KeyObject` types | `CryptoKey` types |

Key generation becomes async, so the constructor changes to a **static factory**:

```typescript
const client = await VmClient.create(account, 'https://crn.example.com')
```

### Alternatives considered

- **Conditional node:crypto / crypto.subtle:** Two code paths, more complexity, marginal perf gain not worth it.
- **Injectable CryptoProvider interface:** Over-engineered for exactly two operations (keygen + sign).

## SDK VmClient changes (vs PR #202)

1. Replace `node:crypto` with `crypto.subtle`
2. Static factory `VmClient.create()` instead of sync constructor
3. Add `streamLogs(vmId)` — WebSocket with auth message, returns `AsyncGenerator<LogEntry>`
4. Add `reserveResources(config)` — POST to `/control/reserve_resources` with auth headers
5. Replace `Buffer` usage with `Uint8Array` + hex helpers where possible
6. Update tests for async key generation

### Signing correctness (verified)

The signing logic in PR #202 already matches both the Python SDK and CRN server expectations:

- **ETH:** EIP-191 signature over JSON string bytes (via `account.sign()`)
- **SOL:** Direct signature over hex-encoded payload bytes (via `account.sign()`)
- **Operations:** ES256 (ECDSA P-256 + SHA-256, IEEE P1363 format) with ephemeral key

No changes needed to the signing logic itself — only the crypto primitives that generate keys and sign operation payloads.

## Front-end migration

### Remove from `ExecutableManager` (~200 lines)

- `getKeyPair()`, `getAuthPubKeyToken()`, `getAuthOperationToken()`
- `sendPostOperation()`
- `subscribeLogs()`
- `KeyPair`, `AuthPubKeyToken`, `SignedPublicKeyHeader` types
- `KEYPAIR_TTL` constant and static `cachedPubKeyToken` cache

### Keep in `ExecutableManager`

- Higher-level orchestration (add/delete instances, cost, checkout steps)
- PAYG stream management, SSH key management, domain management

### Usage pattern

```typescript
// Before:
await manager.sendPostOperation({ hostname, operation: 'stop', vmId })

// After:
const vmClient = await VmClient.create(account, nodeUrl)
await vmClient.stopInstance(vmId)
```

VmClient instantiated in hooks (`useExecutableActions`), cached per CRN domain to reuse the pubkey header across operations.

## PR sequence (strict merge order)

```
PR #1 (aleph-vm #874: backup/restore endpoints)
  -> PR #2 (aleph-sdk-ts: browser-compatible VmClient rewrite)
       -> PR #3 (aleph-sdk-ts: version bump + publish)
            -> PR #4 (front-aleph-cloud-page: migrate to VmClient)
```

### PR #1: `aleph-im/aleph-vm` #874 (exists, by Alie)

Adds `/backup`, `/restore`, `/backup/{id}` endpoints and `DELETE` to allowed auth methods.

### PR #2: `aleph-im/aleph-sdk-ts` (rewrite of #202)

Browser-compatible VmClient with Web Crypto API, log streaming, resource reservation.

### PR #3: `aleph-im/aleph-sdk-ts`

Version bump and npm publish of `@aleph-sdk/client`.

### PR #4: `aleph-im/front-aleph-cloud-page`

Replace `ExecutableManager` VM control code with `@aleph-sdk/client` VmClient. Remove ~200 lines of duplicated auth/crypto code.

### Optional follow-ups

- Integration tests against a live CRN
- Clean up any remaining duplicated CRN auth code in front-end
