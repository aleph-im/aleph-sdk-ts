# Backlog

Ideas and scope creep captured for later consideration.

---

## How Items Get Here

- Scope drift detected during focused work (active interrupt)
- Ideas that come up but aren't current priority
- "We should also..." moments
- Features identified but deferred

---

## Open Items

### 2026-02-26 - Add streamLogs async generator tests
**Source:** Identified during final code review of VmClient (PR #203)
**Description:** The `streamLogs` method is the most complex in VmClient (async generator with WebSocket, message queue, error/close handling, abort signal). Currently only URL construction and header building are tested. Add tests using a mock WebSocket that exercise: normal message flow, error handling, clean close, and abort signal.
**Priority:** Medium

### 2026-02-26 - Add base58Decode standalone unit tests
**Source:** Identified during final code review of VmClient (PR #203)
**Description:** `base58Decode` is only exercised indirectly through SOL signing tests with trivially short input (`'2gPmh'`). Edge cases (empty input, leading zeros, invalid characters) are handled but untested. Add dedicated tests, possibly using `bs58` from `packages/solana` as a reference oracle.
**Priority:** Low

### 2026-02-26 - Add restoreFromVolume/restoreFromFile test coverage
**Source:** Identified during final code review of VmClient (PR #203)
**Description:** Both restore methods lack test coverage. `restoreFromFile` uses FormData which needs careful mocking.
**Priority:** Low

### 2026-02-26 - Draft front-end migration PR (front-aleph-cloud-page)
**Source:** VmClient implementation plan — Tasks 9-11
**Description:** Replace `ExecutableManager`'s duplicated CRN auth/VM control code (~200 lines) with `@aleph-sdk/client` VmClient. Remove `getKeyPair()`, `getAuthPubKeyToken()`, `getAuthOperationToken()`, `sendPostOperation()`, `subscribeLogs()` and related types. Cache VmClient per CRN domain in hooks. See `docs/plans/2026-02-26-vmclient-implementation.md` Tasks 9-11 for full plan.
**Priority:** High (blocked on PR #203 merge + npm publish)

### 2026-02-26 - Version bump and npm publish @aleph-sdk/client
**Source:** VmClient implementation plan — PR #3
**Description:** After PR #203 merges, bump version and publish `@aleph-sdk/client` to npm so the front-end can consume VmClient.
**Priority:** High (blocked on PR #203 merge)

### 2026-02-26 - Integration tests against live CRN
**Source:** VmClient design doc
**Description:** Run VmClient operations against a real CRN to verify auth flow end-to-end. Currently all tests use mocked fetch/crypto.
**Priority:** Low

---

## Completed / Rejected

<details>
<summary>Archived items</summary>

<!-- Completed items moved here with checkmark and date -->

</details>
