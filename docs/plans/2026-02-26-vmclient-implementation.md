# VmClient Browser-Compatible Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite VmClient to use Web Crypto API (browser + Node.js), add log streaming and resource reservation, then migrate the front-end to consume it.

**Architecture:** VmClient lives in `@aleph-sdk/client`. It uses `crypto.subtle` for ephemeral P-256 key generation and ES256 operation signing. Wallet signatures are delegated to the existing `Account.sign()` abstraction. A static factory `VmClient.create()` handles async key generation. WebSocket log streaming follows the existing SDK pattern (browser native WebSocket vs `ws` for Node.js).

**Tech Stack:** TypeScript, Web Crypto API (`crypto.subtle`), WebSocket, Jest

---

## PR #2: Browser-Compatible VmClient (aleph-sdk-ts) -- COMPLETED

Implemented as PR #203. PR #1 (aleph-vm #874) already exists. PR #3 and #4 come after.

**Status:** All 8 tasks completed. PR #203 created, PR #202 closed (superseded).

---

### Task 1: Hex encoding utilities

**Files:**
- Create: `packages/client/src/utils/hex.ts`
- Test: `packages/client/__tests__/hex.test.ts`

These replace `Buffer.from(...).toString('hex')` and `Buffer.from(str, 'hex')` with browser-safe equivalents. The SDK already uses `Buffer` via polyfills in browser contexts, but these utilities keep VmClient dependency-free.

**Step 1: Write the failing tests**

Create `packages/client/__tests__/hex.test.ts`:

```typescript
import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8 } from '../src/utils/hex'

describe('hex utilities', () => {
  it('should round-trip bytes through hex', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255])
    const hex = bytesToHex(original)
    expect(hex).toBe('00017f80ff')
    expect(hexToBytes(hex)).toEqual(original)
  })

  it('should handle empty input', () => {
    expect(bytesToHex(new Uint8Array(0))).toBe('')
    expect(hexToBytes('')).toEqual(new Uint8Array(0))
  })

  it('should encode UTF-8 strings to bytes and back', () => {
    const str = '{"hello":"world"}'
    const bytes = utf8ToBytes(str)
    expect(bytesToUtf8(bytes)).toBe(str)
  })

  it('should handle UTF-8 with non-ASCII characters', () => {
    const str = 'expires: 2026-02-26T00:00:00.000Z'
    expect(bytesToUtf8(utf8ToBytes(str))).toBe(str)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest packages/client/__tests__/hex.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `packages/client/src/utils/hex.ts`:

```typescript
export function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest packages/client/__tests__/hex.test.ts --verbose`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add packages/client/src/utils/hex.ts packages/client/__tests__/hex.test.ts
git commit -m "feat(client): add browser-safe hex encoding utilities"
```

---

### Task 2: VmClient types and VmOperation enum

**Files:**
- Create: `packages/client/src/vmClient.ts`

No tests yet — just the type foundation that other tests will import.

**Step 1: Write the types**

Create `packages/client/src/vmClient.ts`:

```typescript
import { Account } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'

import { bytesToHex, utf8ToBytes } from './utils/hex'

// --- Types ---

export enum VmOperation {
  Stop = 'stop',
  Reboot = 'reboot',
  Erase = 'erase',
  Expire = 'expire',
  Reinstall = 'reinstall',
  Backup = 'backup',
  Restore = 'restore',
  StreamLogs = 'stream_logs',
  Update = 'update',
}

export type VmOperationResult = {
  status: number | null
  response: string
}

export type LogEntry = {
  type: 'stdout' | 'stderr'
  message: string
}

// --- Base58 decoder (for Solana signature conversion) ---

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Decode(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0)

  const bytes = [0]
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char)
    if (value < 0) throw new Error(`Invalid base58 character: ${char}`)

    let carry = value
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  let leadingZeros = 0
  for (const char of input) {
    if (char !== '1') break
    leadingZeros++
  }

  const result = new Uint8Array(leadingZeros + bytes.length)
  const reversed = bytes.reverse()
  result.set(new Uint8Array(reversed), leadingZeros)
  return result
}
```

This is just the foundation — the class comes in the next task.

**Step 2: Commit**

```bash
git add packages/client/src/vmClient.ts
git commit -m "feat(client): add VmClient types and VmOperation enum"
```

---

### Task 3: VmClient core — static factory, ephemeral key, pubkey header

This is the heart of the implementation: async key generation and wallet-signed pubkey header.

**Files:**
- Modify: `packages/client/src/vmClient.ts`
- Test: `packages/client/__tests__/vmClient.test.ts`

**Step 1: Write failing tests for construction and auth headers**

Create `packages/client/__tests__/vmClient.test.ts`:

```typescript
import { Blockchain } from '../../core/src'
import { VmClient, VmOperation } from '../src/vmClient'

// --- Mock Account ---

function createMockAccount(chain: Blockchain = Blockchain.ETH) {
  return {
    address: '0xTestAddress1234567890',
    getChain: () => chain,
    sign: jest.fn().mockResolvedValue('0xmocksignature123'),
  }
}

// --- Mock fetch ---

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({
    status: 200,
    text: () => Promise.resolve('OK'),
  })
})

// --- Tests ---

describe('VmClient', () => {
  describe('create (static factory)', () => {
    it('should create a VmClient asynchronously', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')
      expect(client.nodeDomain).toBe('crn.example.com')
    })

    it('should strip trailing slashes from node URL', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com///')
      expect(client.nodeDomain).toBe('crn.example.com')
    })

    it('should throw if node URL has no hostname', async () => {
      const account = createMockAccount()
      await expect(VmClient.create(account, 'not-a-url')).rejects.toThrow()
    })
  })

  describe('authentication headers', () => {
    it('should produce valid X-SignedPubKey header', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [, options] = mockFetch.mock.calls[0]
      const pubkeyHeader = JSON.parse(options.headers['X-SignedPubKey'])

      expect(pubkeyHeader.sender).toBe('0xTestAddress1234567890')
      expect(pubkeyHeader.payload).toBeDefined()
      expect(pubkeyHeader.signature).toBe('0xmocksignature123')
      expect(pubkeyHeader.content.domain).toBe('crn.example.com')

      const payloadJson = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(
            (pubkeyHeader.payload.match(/.{2}/g) || []).map((b: string) => parseInt(b, 16)),
          ),
        ),
      )
      expect(payloadJson.pubkey).toBeDefined()
      expect(payloadJson.alg).toBe('ECDSA')
      expect(payloadJson.domain).toBe('crn.example.com')
      expect(payloadJson.address).toBe('0xTestAddress1234567890')
      expect(payloadJson.chain).toBe('ETH')
      expect(payloadJson.expires).toBeDefined()
    })

    it('should produce valid X-SignedOperation header', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [, options] = mockFetch.mock.calls[0]
      const opHeader = JSON.parse(options.headers['X-SignedOperation'])

      expect(opHeader.payload).toBeDefined()
      expect(opHeader.signature).toBeDefined()

      const payloadJson = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(
            (opHeader.payload.match(/.{2}/g) || []).map((b: string) => parseInt(b, 16)),
          ),
        ),
      )
      expect(payloadJson.time).toBeDefined()
      expect(payloadJson.method).toBe('POST')
      expect(payloadJson.path).toBe('/control/machine/vm123/stop')
      expect(payloadJson.domain).toBe('crn.example.com')
    })

    it('should reuse pubkey header across requests', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.stopInstance('vm1')
      await client.rebootInstance('vm2')

      // account.sign should only be called once (for pubkey header)
      expect(account.sign).toHaveBeenCalledTimes(1)

      const header1 = mockFetch.mock.calls[0][1].headers['X-SignedPubKey']
      const header2 = mockFetch.mock.calls[1][1].headers['X-SignedPubKey']
      expect(header1).toBe(header2)
    })

    it('should set chain to SOL for Solana accounts', async () => {
      const account = createMockAccount(Blockchain.SOL)
      account.sign.mockResolvedValue(
        JSON.stringify({
          signature: '11111111111111111111111111111111',
          publicKey: 'SolPubKey123',
        }),
      )
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [, options] = mockFetch.mock.calls[0]
      const pubkeyHeader = JSON.parse(options.headers['X-SignedPubKey'])
      const payloadJson = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(
            (pubkeyHeader.payload.match(/.{2}/g) || []).map((b: string) => parseInt(b, 16)),
          ),
        ),
      )
      expect(payloadJson.chain).toBe('SOL')
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx jest packages/client/__tests__/vmClient.test.ts --verbose`
Expected: FAIL — `VmClient.create` is not a function

**Step 3: Implement VmClient core**

Append to `packages/client/src/vmClient.ts` (after the existing types):

```typescript
// --- VmClient ---

/**
 * Client for managing VM instances on Aleph CRN (Compute Resource Node)
 * endpoints. Provides authenticated access to instance lifecycle operations
 * including start, stop, reboot, erase, reinstall, backup, and restore.
 *
 * Uses Web Crypto API for browser + Node.js compatibility.
 *
 * Authentication uses a two-header scheme:
 * - X-SignedPubKey: ephemeral P-256 public key signed by wallet (24h validity)
 * - X-SignedOperation: per-request payload signed by ephemeral key (ES256)
 */
export class VmClient {
  private readonly account: Account
  private readonly nodeUrl: string
  private readonly ephemeralPublicKey: CryptoKey
  private readonly ephemeralPrivateKey: CryptoKey
  private readonly pubkeyPayload: Record<string, unknown>
  private pubkeySignatureHeader: string | null = null

  private constructor(
    account: Account,
    nodeUrl: string,
    publicKey: CryptoKey,
    privateKey: CryptoKey,
  ) {
    this.account = account
    this.nodeUrl = nodeUrl.replace(/\/+$/, '')
    this.ephemeralPublicKey = publicKey
    this.ephemeralPrivateKey = privateKey
    this.pubkeyPayload = this.buildPubkeyPayload()
  }

  static async create(account: Account, nodeUrl: string): Promise<VmClient> {
    // Validate URL early
    const url = new URL(nodeUrl.replace(/\/+$/, ''))
    if (!url.hostname) {
      throw new Error('Could not parse node domain from URL')
    }

    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )

    return new VmClient(account, nodeUrl, keyPair.publicKey, keyPair.privateKey)
  }

  get nodeDomain(): string {
    return new URL(this.nodeUrl).hostname
  }

  // --- Authentication internals ---

  private buildPubkeyPayload(): Record<string, unknown> {
    // Export public key synchronously is not possible with CryptoKey.
    // We do it lazily in ensurePubkeyHeader instead.
    // This method builds the non-key parts of the payload.
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    return {
      alg: 'ECDSA',
      domain: this.nodeDomain,
      address: this.account.address,
      expires: expires.toISOString(),
      chain: this.account.getChain() === Blockchain.SOL ? 'SOL' : 'ETH',
    }
  }

  private async ensurePubkeyHeader(): Promise<string> {
    if (!this.pubkeySignatureHeader) {
      this.pubkeySignatureHeader = await this.buildPubkeySignatureHeader()
    }
    return this.pubkeySignatureHeader
  }

  private async buildPubkeySignatureHeader(): Promise<string> {
    const jwk = await crypto.subtle.exportKey('jwk', this.ephemeralPublicKey)
    const fullPayload = { pubkey: jwk, ...this.pubkeyPayload }
    const jsonString = JSON.stringify(fullPayload)
    const jsonBytes = utf8ToBytes(jsonString)
    const hexPayload = bytesToHex(jsonBytes)
    const isSOL = this.account.getChain() === Blockchain.SOL

    const signable = {
      time: 0,
      sender: this.account.address,
      getVerificationBuffer: () =>
        Buffer.from(isSOL ? utf8ToBytes(hexPayload) : jsonBytes),
    }

    const rawSignature = await this.account.sign(signable)
    const signature = isSOL
      ? this.convertSolSignatureToHex(rawSignature)
      : rawSignature

    return JSON.stringify({
      sender: this.account.address,
      payload: hexPayload,
      signature,
      content: { domain: this.nodeDomain },
    })
  }

  private convertSolSignatureToHex(jsonSignature: string): string {
    const parsed = JSON.parse(jsonSignature) as {
      signature: string
      publicKey: string
    }
    const bytes = base58Decode(parsed.signature)
    return '0x' + bytesToHex(bytes)
  }

  private async signControlPayload(
    payload: Record<string, string>,
  ): Promise<string> {
    const payloadBytes = utf8ToBytes(JSON.stringify(payload))
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      this.ephemeralPrivateKey,
      payloadBytes,
    )

    return JSON.stringify({
      payload: bytesToHex(payloadBytes),
      signature: bytesToHex(new Uint8Array(signature)),
    })
  }

  private buildControlPayload(
    vmId: string,
    operation: string,
    method: string,
  ): Record<string, string> {
    return {
      time: new Date().toISOString(),
      method: method.toUpperCase(),
      path: `/control/machine/${vmId}/${operation}`,
      domain: this.nodeDomain,
    }
  }

  async buildHeaders(
    vmId: string,
    operation: string,
    method: string,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const payload = this.buildControlPayload(vmId, operation, method)
    const signedOperation = await this.signControlPayload(payload)
    const pubkeyHeader = await this.ensurePubkeyHeader()

    return {
      url: `${this.nodeUrl}${payload.path}`,
      headers: {
        'X-SignedPubKey': pubkeyHeader,
        'X-SignedOperation': signedOperation,
      },
    }
  }

  // --- Generic operation ---

  async performOperation(
    vmId: string,
    operation: string,
    options?: {
      method?: string
      params?: Record<string, string>
      jsonData?: Record<string, unknown>
    },
  ): Promise<VmOperationResult> {
    const method = options?.method ?? 'POST'
    const { url, headers } = await this.buildHeaders(vmId, operation, method)

    const requestUrl = new URL(url)
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        requestUrl.searchParams.set(key, value)
      }
    }

    const fetchHeaders: Record<string, string> = { ...headers }
    const fetchOptions: RequestInit = {
      method,
      headers: fetchHeaders,
    }
    if (options?.jsonData) {
      fetchOptions.body = JSON.stringify(options.jsonData)
      fetchHeaders['Content-Type'] = 'application/json'
    }

    try {
      const response = await fetch(requestUrl.toString(), fetchOptions)
      return {
        status: response.status,
        response: await response.text(),
      }
    } catch (error) {
      return { status: null, response: String(error) }
    }
  }

  // --- Instance lifecycle ---

  async startInstance(vmId: string): Promise<VmOperationResult> {
    try {
      const response = await fetch(
        `${this.nodeUrl}/control/allocation/notify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance: vmId }),
        },
      )
      return {
        status: response.status,
        response: await response.text(),
      }
    } catch (error) {
      return { status: null, response: String(error) }
    }
  }

  async stopInstance(vmId: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Stop)
  }

  async rebootInstance(vmId: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Reboot)
  }

  async eraseInstance(vmId: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Erase)
  }

  async expireInstance(vmId: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Expire)
  }

  // --- Reinstall ---

  async reinstallInstance(
    vmId: string,
    eraseVolumes = true,
  ): Promise<VmOperationResult> {
    const params = eraseVolumes ? undefined : { erase_volumes: 'false' }
    return this.performOperation(vmId, VmOperation.Reinstall, { params })
  }

  // --- Backup ---

  async createBackup(
    vmId: string,
    options?: {
      includeVolumes?: boolean
      skipFsfreeze?: boolean
    },
  ): Promise<VmOperationResult> {
    const params: Record<string, string> = {}
    if (options?.includeVolumes) params['include_volumes'] = 'true'
    if (options?.skipFsfreeze) params['skip_fsfreeze'] = 'true'

    return this.performOperation(vmId, VmOperation.Backup, {
      params: Object.keys(params).length > 0 ? params : undefined,
    })
  }

  async getBackup(vmId: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Backup, { method: 'GET' })
  }

  async deleteBackup(
    vmId: string,
    backupId: string,
  ): Promise<VmOperationResult> {
    if (!/^[a-zA-Z0-9_-]+$/.test(backupId)) {
      throw new Error(`Invalid backup ID format: ${backupId}`)
    }
    return this.performOperation(vmId, `backup/${backupId}`, {
      method: 'DELETE',
    })
  }

  // --- Restore ---

  async restoreFromVolume(
    vmId: string,
    volumeRef: string,
  ): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Restore, {
      jsonData: { volume_ref: volumeRef },
    })
  }

  async restoreFromFile(
    vmId: string,
    rootfsData: Blob,
  ): Promise<VmOperationResult> {
    const { url, headers } = await this.buildHeaders(
      vmId,
      VmOperation.Restore,
      'POST',
    )

    const formData = new FormData()
    formData.append('rootfs', rootfsData)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })
      return {
        status: response.status,
        response: await response.text(),
      }
    } catch (error) {
      return { status: null, response: String(error) }
    }
  }

  async getRestoreEndpoint(
    vmId: string,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    return this.buildHeaders(vmId, VmOperation.Restore, 'POST')
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest packages/client/__tests__/vmClient.test.ts --verbose`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
git add packages/client/src/vmClient.ts packages/client/__tests__/vmClient.test.ts
git commit -m "feat(client): VmClient core with Web Crypto API"
```

---

### Task 4: VmClient lifecycle and operation tests

**Files:**
- Modify: `packages/client/__tests__/vmClient.test.ts`

Add tests for all lifecycle operations, backup, restore, reinstall, query params, JSON body, error handling.

**Step 1: Append tests to `vmClient.test.ts`**

Add inside the outer `describe('VmClient', ...)` block:

```typescript
  describe('performOperation', () => {
    it('should send authenticated POST request', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      const result = await client.performOperation('vm123', VmOperation.Stop)

      expect(result.status).toBe(200)
      expect(result.response).toBe('OK')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/stop')
      expect(options.method).toBe('POST')
      expect(options.headers['X-SignedPubKey']).toBeDefined()
      expect(options.headers['X-SignedOperation']).toBeDefined()
    })

    it('should include query params when provided', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.performOperation('vm123', VmOperation.Reinstall, {
        params: { erase_volumes: 'false' },
      })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('erase_volumes=false')
    })

    it('should send JSON body when provided', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.performOperation('vm123', VmOperation.Restore, {
        jsonData: { volume_ref: 'abc123' },
      })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.body).toBe('{"volume_ref":"abc123"}')
      expect(options.headers['Content-Type']).toBe('application/json')
    })

    it('should use GET method when specified', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.performOperation('vm123', VmOperation.Backup, {
        method: 'GET',
      })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.method).toBe('GET')
    })

    it('should return null status on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      const result = await client.performOperation('vm123', VmOperation.Stop)

      expect(result.status).toBeNull()
      expect(result.response).toContain('Network failure')
    })
  })

  describe('instance lifecycle', () => {
    it('stopInstance should POST to stop', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/stop')
      expect(options.method).toBe('POST')
    })

    it('rebootInstance should POST to reboot', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.rebootInstance('vm123')

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/reboot')
    })

    it('eraseInstance should POST to erase', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.eraseInstance('vm123')

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/erase')
    })

    it('expireInstance should POST to expire', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.expireInstance('vm123')

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/expire')
    })

    it('startInstance should POST to allocation notify', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.startInstance('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://crn.example.com/control/allocation/notify')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({ instance: 'vm123' })
    })
  })

  describe('reinstallInstance', () => {
    it('should POST to reinstall without params by default', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.reinstallInstance('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/reinstall')
      expect(url).not.toContain('erase_volumes')
      expect(options.method).toBe('POST')
    })

    it('should add erase_volumes=false when eraseVolumes is false', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.reinstallInstance('vm123', false)

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('erase_volumes=false')
    })
  })

  describe('backup operations', () => {
    it('createBackup should POST to backup', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.createBackup('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/backup')
      expect(options.method).toBe('POST')
    })

    it('createBackup should include options as query params', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.createBackup('vm123', {
        includeVolumes: true,
        skipFsfreeze: true,
      })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('include_volumes=true')
      expect(url).toContain('skip_fsfreeze=true')
    })

    it('getBackup should GET backup info', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.getBackup('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/backup')
      expect(options.method).toBe('GET')
    })

    it('deleteBackup should DELETE specific backup', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.deleteBackup('vm123', 'backup-abc_123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/backup/backup-abc_123')
      expect(options.method).toBe('DELETE')
    })

    it('deleteBackup should reject invalid backup IDs', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await expect(
        client.deleteBackup('vm123', '../etc/passwd'),
      ).rejects.toThrow('Invalid backup ID format')
    })
  })

  describe('restore operations', () => {
    it('restoreFromVolume should POST with volume_ref JSON body', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      await client.restoreFromVolume('vm123', 'volume-hash-abc')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/restore')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({
        volume_ref: 'volume-hash-abc',
      })
    })

    it('restoreFromFile should POST multipart form data', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      const fakeData = new Blob(['fake rootfs data'])
      await client.restoreFromFile('vm123', fakeData)

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/restore')
      expect(options.method).toBe('POST')
      expect(options.body).toBeInstanceOf(FormData)
    })

    it('getRestoreEndpoint should return URL and headers', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      const endpoint = await client.getRestoreEndpoint('vm123')

      expect(endpoint.url).toContain('/control/machine/vm123/restore')
      expect(endpoint.headers['X-SignedPubKey']).toBeDefined()
      expect(endpoint.headers['X-SignedOperation']).toBeDefined()
    })
  })
```

**Step 2: Run tests**

Run: `npx jest packages/client/__tests__/vmClient.test.ts --verbose`
Expected: PASS (all tests — implementation already covers these)

**Step 3: Commit**

```bash
git add packages/client/__tests__/vmClient.test.ts
git commit -m "test(client): comprehensive VmClient operation tests"
```

---

### Task 5: Log streaming

**Files:**
- Modify: `packages/client/src/vmClient.ts`
- Modify: `packages/client/__tests__/vmClient.test.ts`

Log streaming uses WebSocket with auth sent as the first message. The SDK already has a browser/Node WebSocket pattern, but for VmClient we use native WebSocket (available in Node 22+ and all browsers). Since the SDK targets Node 20+, we use `isNode()` from `@aleph-sdk/core` to conditionally import `ws` for Node < 22.

However, since the monorepo targets Node 20+, and Node 21+ has native WebSocket behind a flag, and Node 22+ has it stable, and the front-end is the primary consumer (browser), we can use native WebSocket and document Node 22+ as required for log streaming in Node.js.

**Step 1: Write failing test**

Append to `vmClient.test.ts`:

```typescript
  describe('streamLogs', () => {
    it('should build correct WebSocket URL and auth message', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      // We can't easily mock WebSocket in Jest, so test the
      // buildHeaders output that streamLogs would use
      const { url, headers } = await client.buildHeaders(
        'vm123',
        VmOperation.StreamLogs,
        'GET',
      )

      expect(url).toBe(
        'https://crn.example.com/control/machine/vm123/stream_logs',
      )
      expect(headers['X-SignedPubKey']).toBeDefined()
      expect(headers['X-SignedOperation']).toBeDefined()
    })
  })
```

**Step 2: Add streamLogs to VmClient**

Add to the VmClient class in `vmClient.ts`:

```typescript
  // --- Log streaming ---

  async *streamLogs(
    vmId: string,
    abort?: AbortSignal,
  ): AsyncGenerator<LogEntry> {
    const { headers } = await this.buildHeaders(
      vmId,
      VmOperation.StreamLogs,
      'GET',
    )

    const wsUrl = this.nodeUrl.replace(/^http/, 'ws') +
      `/control/machine/${vmId}/stream_logs`

    const ws = new WebSocket(wsUrl)

    const messageQueue: LogEntry[] = []
    let resolve: (() => void) | null = null
    let closed = false
    let error: Error | null = null

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          auth: {
            'X-SignedPubKey': JSON.parse(headers['X-SignedPubKey']),
            'X-SignedOperation': JSON.parse(headers['X-SignedOperation']),
          },
        }),
      )
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(
          typeof event.data === 'string'
            ? event.data
            : event.data.toString(),
        )
        if (data.type && data.message !== undefined) {
          messageQueue.push({
            type: data.type,
            message: data.message,
          })
          resolve?.()
        }
      } catch {
        // Skip non-JSON messages
      }
    }

    ws.onerror = (event) => {
      error = new Error('WebSocket error')
      resolve?.()
    }

    ws.onclose = () => {
      closed = true
      resolve?.()
    }

    abort?.addEventListener('abort', () => {
      ws.close(1000, 'aborted')
    })

    try {
      while (!closed) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!
          continue
        }
        if (error) throw error
        await new Promise<void>((r) => { resolve = r })
        resolve = null
      }
      // Drain remaining messages
      while (messageQueue.length > 0) {
        yield messageQueue.shift()!
      }
    } finally {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000)
      }
    }
  }
```

**Step 3: Run tests**

Run: `npx jest packages/client/__tests__/vmClient.test.ts --verbose`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/client/src/vmClient.ts packages/client/__tests__/vmClient.test.ts
git commit -m "feat(client): add WebSocket log streaming to VmClient"
```

---

### Task 6: Resource reservation

**Files:**
- Modify: `packages/client/src/vmClient.ts`
- Modify: `packages/client/__tests__/vmClient.test.ts`

This matches the front-end's `reserveCRNResources` — POST to `/control/reserve_resources` with auth headers and instance config as body.

**Step 1: Write failing test**

Append to `vmClient.test.ts`:

```typescript
  describe('reserveResources', () => {
    it('should POST to /control/reserve_resources with auth headers', async () => {
      const account = createMockAccount()
      const client = await VmClient.create(account, 'https://crn.example.com')

      const config = { instance: 'vm123', resources: { vcpus: 2 } }
      await client.reserveResources(config)

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/reserve_resources')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual(config)
      expect(options.headers['X-SignedPubKey']).toBeDefined()
      expect(options.headers['X-SignedOperation']).toBeDefined()
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `npx jest packages/client/__tests__/vmClient.test.ts -t "reserveResources" --verbose`
Expected: FAIL — `reserveResources` is not a function

**Step 3: Add reserveResources to VmClient**

Add to the VmClient class:

```typescript
  // --- Resource reservation ---

  async reserveResources(
    config: Record<string, unknown>,
  ): Promise<VmOperationResult> {
    const path = '/control/reserve_resources'
    const payload = {
      time: new Date().toISOString(),
      method: 'POST',
      path,
      domain: this.nodeDomain,
    }
    const signedOperation = await this.signControlPayload(payload)
    const pubkeyHeader = await this.ensurePubkeyHeader()

    try {
      const response = await fetch(`${this.nodeUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SignedPubKey': pubkeyHeader,
          'X-SignedOperation': signedOperation,
        },
        body: JSON.stringify(config),
      })
      return {
        status: response.status,
        response: await response.text(),
      }
    } catch (error) {
      return { status: null, response: String(error) }
    }
  }
```

**Step 4: Run test**

Run: `npx jest packages/client/__tests__/vmClient.test.ts -t "reserveResources" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/client/src/vmClient.ts packages/client/__tests__/vmClient.test.ts
git commit -m "feat(client): add CRN resource reservation to VmClient"
```

---

### Task 7: Export and build

**Files:**
- Modify: `packages/client/src/index.ts`

**Step 1: Add VmClient export**

Update `packages/client/src/index.ts`:

```typescript
export * from './httpClient'
export * from './authenticatedHttpClient'
export * from './vmClient'
```

**Step 2: Build the full monorepo**

Run: `npm run build`
Expected: All 16 packages build successfully

**Step 3: Run all client tests**

Run: `npx jest packages/client/ --verbose`
Expected: All tests pass

**Step 4: Commit**

```bash
git add packages/client/src/index.ts
git commit -m "feat(client): export VmClient from @aleph-sdk/client"
```

---

### Task 8: Run full test suite and lint

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass across all packages

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Fix any issues found, commit if needed**

---

## PR #4: Front-End Migration (front-aleph-cloud-page)

This PR is separate and depends on PR #2 being merged and published.

### Task 9: Update SDK dependency

**Files:**
- Modify: `package.json`

**Step 1: Update @aleph-sdk/client to new version**

```bash
npm install @aleph-sdk/client@latest
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: update @aleph-sdk/client with VmClient"
```

---

### Task 10: Replace ExecutableManager auth + operations

**Files:**
- Modify: `src/domain/executable.ts`

**Step 1: Remove auth types and methods**

Delete from `executable.ts`:
- `KeyPair` type
- `SignedPublicKeyHeader` type
- `AuthPubKeyToken` type
- `KEYPAIR_TTL` constant
- `static cachedPubKeyToken` field
- `getKeyPair()` method
- `getAuthPubKeyToken()` method
- `getAuthOperationToken()` method
- `sendPostOperation()` method
- `subscribeLogs()` method

**Step 2: Add VmClient import and usage**

```typescript
import { VmClient } from '@aleph-sdk/client'
```

Replace `sendPostOperation` call sites with VmClient methods. The VmClient should be created per CRN node and cached. Add a helper:

```typescript
private vmClients = new Map<string, VmClient>()

private async getVmClient(nodeUrl: string): Promise<VmClient> {
  const domain = new URL(nodeUrl).hostname
  let client = this.vmClients.get(domain)
  if (!client) {
    client = await VmClient.create(this.account!, nodeUrl)
    this.vmClients.set(domain, client)
  }
  return client
}
```

**Step 3: Replace operation calls**

Find all `this.sendPostOperation(...)` calls and replace with:

```typescript
const vmClient = await this.getVmClient(hostname)
await vmClient.stopInstance(vmId)  // or rebootInstance, etc.
```

**Step 4: Replace log streaming**

Find `this.subscribeLogs(...)` calls and replace with:

```typescript
const vmClient = await this.getVmClient(hostname)
const abortController = new AbortController()
for await (const entry of vmClient.streamLogs(vmId, abortController.signal)) {
  // handle entry
}
```

**Step 5: Replace resource reservation**

Find `this.reserveCRNResources(...)` and replace with:

```typescript
const vmClient = await this.getVmClient(node.address)
await vmClient.reserveResources(instanceConfig)
```

**Step 6: Verify the front-end builds**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/domain/executable.ts
git commit -m "refactor: replace ExecutableManager VM control with VmClient from SDK"
```

---

### Task 11: Update hooks

**Files:**
- Modify: `src/hooks/common/useExecutableActions.ts`
- Modify: `src/hooks/common/useRequestExecutableLogsFeed.ts` (or equivalent)

Update any hook that directly used the removed methods to use the new VmClient-based API from ExecutableManager.

**Step 1: Verify hooks still compile and work**

The hooks call ExecutableManager methods, so if Task 10 preserved the public API (just changed internals), hooks should work unchanged. If any hook directly used `sendPostOperation` or `subscribeLogs`, update those call sites.

**Step 2: Test in browser**

Run dev server and verify:
- VM stop/start/reboot works
- Log streaming works
- No console errors

**Step 3: Commit**

```bash
git add src/hooks/
git commit -m "refactor: update hooks for VmClient-based ExecutableManager"
```
