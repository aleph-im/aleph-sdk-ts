import { Account } from '@aleph-sdk/account'
import { SignableMessage } from '@aleph-sdk/account'
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
}

export type VmOperationResult = {
  status: number | null
  response: string
}

export type LogEntry = {
  type: 'stdout' | 'stderr'
  message: string
}

// --- Base58 decoding (for Solana signature conversion) ---

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Decode(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0)

  const bytes = [0]
  for (let i = 0; i < input.length; i++) {
    const charIndex = BASE58_ALPHABET.indexOf(input[i])
    if (charIndex < 0) {
      throw new Error(`Invalid base58 character: ${input[i]}`)
    }
    let carry = charIndex
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

  // Preserve leading zeros
  let leadingZeros = 0
  for (let i = 0; i < input.length && input[i] === '1'; i++) {
    leadingZeros++
  }

  const result = new Uint8Array(leadingZeros + bytes.length)
  // Leading zeros are already 0 in the Uint8Array
  for (let i = 0; i < bytes.length; i++) {
    result[leadingZeros + i] = bytes[bytes.length - 1 - i]
  }
  return result
}

// --- VmClient ---

const EPHEMERAL_KEY_PARAMS: EcKeyGenParams = {
  name: 'ECDSA',
  namedCurve: 'P-256',
}

const SIGN_ALGORITHM: EcdsaParams = {
  name: 'ECDSA',
  hash: { name: 'SHA-256' },
}

const PUBKEY_TTL_MS = 24 * 60 * 60 * 1000

export class VmClient {
  private readonly account: Account
  private readonly nodeUrl: string
  private readonly ephemeralKey: CryptoKeyPair
  private cachedPubkeyHeader: string | null = null
  private cachedPubkeyExpiry: number = 0

  private constructor(account: Account, nodeUrl: string, ephemeralKey: CryptoKeyPair) {
    this.account = account
    this.nodeUrl = nodeUrl
    this.ephemeralKey = ephemeralKey
  }

  get nodeDomain(): string {
    return new URL(this.nodeUrl).hostname
  }

  static async create(account: Account, nodeUrl: string): Promise<VmClient> {
    const normalized = nodeUrl.replace(/\/+\s*$/, '')
    try {
      new URL(normalized)
    } catch {
      throw new Error(`Invalid node URL: ${nodeUrl}`)
    }

    const ephemeralKey = await crypto.subtle.generateKey(EPHEMERAL_KEY_PARAMS, true, ['sign', 'verify'])

    return new VmClient(account, normalized, ephemeralKey)
  }

  private async buildPubkeyPayload(): Promise<string> {
    const publicJwk = await crypto.subtle.exportKey('jwk', this.ephemeralKey.publicKey)

    const payload = {
      pubkey: publicJwk,
      alg: 'ECDSA',
      domain: this.nodeDomain,
      address: this.account.address,
      chain: this.account.getChain() === Blockchain.SOL ? 'SOL' : 'ETH',
      expires: new Date(Date.now() + PUBKEY_TTL_MS).toISOString(),
    }

    return JSON.stringify(payload)
  }

  private async buildPubkeySignatureHeader(payloadJson: string): Promise<string> {
    const jsonBytes = utf8ToBytes(payloadJson)
    const hexPayload = bytesToHex(jsonBytes)

    const chain = this.account.getChain()
    let verificationBuffer: Buffer

    if (chain === Blockchain.SOL) {
      verificationBuffer = Buffer.from(utf8ToBytes(hexPayload))
    } else {
      verificationBuffer = Buffer.from(jsonBytes)
    }

    const signable: SignableMessage = {
      time: Date.now() / 1000,
      sender: this.account.address,
      getVerificationBuffer: () => verificationBuffer,
    }

    let signature = await this.account.sign(signable)

    if (chain === Blockchain.SOL) {
      signature = this.convertSolSignatureToHex(signature)
    }

    const header = JSON.stringify({
      sender: this.account.address,
      payload: hexPayload,
      signature,
      content: { domain: this.nodeDomain },
    })

    return header
  }

  async ensurePubkeyHeader(): Promise<string> {
    if (this.cachedPubkeyHeader && Date.now() < this.cachedPubkeyExpiry) {
      return this.cachedPubkeyHeader
    }

    const payloadJson = await this.buildPubkeyPayload()
    const header = await this.buildPubkeySignatureHeader(payloadJson)

    this.cachedPubkeyHeader = header
    this.cachedPubkeyExpiry = Date.now() + PUBKEY_TTL_MS
    return header
  }

  private async signControlPayload(payload: string): Promise<string> {
    const payloadBytes = utf8ToBytes(payload)

    const signatureBuffer = await crypto.subtle.sign(SIGN_ALGORITHM, this.ephemeralKey.privateKey, payloadBytes)

    return bytesToHex(new Uint8Array(signatureBuffer))
  }

  private convertSolSignatureToHex(jsonSignature: string): string {
    const parsed = JSON.parse(jsonSignature)
    const signatureStr = typeof parsed === 'string' ? parsed : parsed?.signature
    if (typeof signatureStr !== 'string') {
      throw new Error('SOL signature must be a string or { signature: string }')
    }
    const decoded = base58Decode(signatureStr)
    return '0x' + bytesToHex(decoded)
  }

  private async buildAuthHeaders(path: string, method: string): Promise<Record<string, string>> {
    const pubkeyHeader = await this.ensurePubkeyHeader()

    const operationPayload = JSON.stringify({
      time: new Date().toISOString(),
      method,
      path,
      domain: this.nodeDomain,
    })

    const hexPayload = bytesToHex(utf8ToBytes(operationPayload))
    const signature = await this.signControlPayload(operationPayload)

    const operationHeader = JSON.stringify({
      sender: this.account.address,
      payload: hexPayload,
      signature,
      content: { domain: this.nodeDomain },
    })

    return {
      'X-SignedPubKey': pubkeyHeader,
      'X-SignedOperation': operationHeader,
    }
  }

  async buildHeaders(
    vmId: string,
    operation: VmOperation,
    method: string = 'POST',
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const path = `/control/machine/${vmId}/${operation}`
    const url = `${this.nodeUrl}${path}`
    const headers = await this.buildAuthHeaders(path, method)

    return { url, headers }
  }

  async performOperation(
    vmId: string,
    operation: VmOperation,
    options?: {
      method?: string
      params?: Record<string, string>
      jsonData?: unknown
    },
  ): Promise<VmOperationResult> {
    const method = options?.method ?? 'POST'
    const { url, headers } = await this.buildHeaders(vmId, operation, method)

    let fullUrl = url
    if (options?.params) {
      const searchParams = new URLSearchParams(options.params)
      fullUrl = `${url}?${searchParams.toString()}`
    }

    const fetchOptions: RequestInit = {
      method,
      headers: { ...headers },
    }

    if (options?.jsonData !== undefined) {
      ;(fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json'
      fetchOptions.body = JSON.stringify(options.jsonData)
    }

    const resp = await fetch(fullUrl, fetchOptions)
    const responseText = await resp.text()

    return {
      status: resp.status,
      response: responseText,
    }
  }

  async startInstance(vmId: string): Promise<VmOperationResult> {
    const url = `${this.nodeUrl}/control/allocation/notify`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance: vmId }),
    })
    const responseText = await resp.text()
    return { status: resp.status, response: responseText }
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

  async reinstallInstance(vmId: string, eraseVolumes?: boolean): Promise<VmOperationResult> {
    const params: Record<string, string> | undefined =
      eraseVolumes !== undefined ? { erase_volumes: String(eraseVolumes) } : undefined

    return this.performOperation(vmId, VmOperation.Reinstall, { params })
  }

  async createBackup(
    vmId: string,
    options?: {
      includeVolumes?: boolean
      skipFsfreeze?: boolean
    },
  ): Promise<VmOperationResult> {
    const params: Record<string, string> = {}
    if (options?.includeVolumes !== undefined) {
      params['include_volumes'] = String(options.includeVolumes)
    }
    if (options?.skipFsfreeze !== undefined) {
      params['skip_fsfreeze'] = String(options.skipFsfreeze)
    }

    return this.performOperation(vmId, VmOperation.Backup, {
      params: Object.keys(params).length > 0 ? params : undefined,
    })
  }

  async getBackup(vmId: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Backup, { method: 'GET' })
  }

  async deleteBackup(vmId: string, backupId: string): Promise<VmOperationResult> {
    if (!/^[a-zA-Z0-9_-]+$/.test(backupId)) {
      throw new Error(
        `Invalid backup ID: ${backupId}. ` +
          'Must contain only alphanumeric characters, ' +
          'underscores, and hyphens.',
      )
    }

    const path = `/control/machine/${vmId}/backup/${backupId}`
    const url = `${this.nodeUrl}${path}`
    const headers = await this.buildAuthHeaders(path, 'DELETE')

    const resp = await fetch(url, { method: 'DELETE', headers })
    const responseText = await resp.text()
    return { status: resp.status, response: responseText }
  }

  async restoreFromVolume(vmId: string, volumeRef: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Restore, { jsonData: { volume_ref: volumeRef } })
  }

  async restoreFromFile(vmId: string, rootfsData: Blob): Promise<VmOperationResult> {
    const { url, headers } = await this.buildHeaders(vmId, VmOperation.Restore, 'POST')

    const formData = new FormData()
    formData.append('rootfs', rootfsData)

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })
    const responseText = await resp.text()
    return { status: resp.status, response: responseText }
  }

  async getRestoreEndpoint(vmId: string): Promise<{ url: string; headers: Record<string, string> }> {
    return this.buildHeaders(vmId, VmOperation.Restore, 'POST')
  }

  getStreamLogsUrl(vmId: string): string {
    const wsBase = this.nodeUrl.replace(/^http/, 'ws')
    return `${wsBase}/control/machine/${vmId}/stream_logs`
  }

  async *streamLogs(vmId: string, abort?: AbortSignal): AsyncGenerator<LogEntry> {
    const { headers } = await this.buildHeaders(vmId, VmOperation.StreamLogs, 'GET')

    const wsUrl = this.getStreamLogsUrl(vmId)
    const ws = new WebSocket(wsUrl)

    const messageQueue: LogEntry[] = []
    let resolve: (() => void) | null = null
    let done = false
    let error: Error | null = null

    const cleanup = () => {
      done = true
      if (resolve) resolve()
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }

    ws.onopen = () => {
      const authMessage = JSON.stringify({
        auth: {
          'X-SignedPubKey': JSON.parse(headers['X-SignedPubKey']),
          'X-SignedOperation': JSON.parse(headers['X-SignedOperation']),
        },
      })
      ws.send(authMessage)
    }

    ws.onmessage = (event: MessageEvent) => {
      const entry = JSON.parse(String(event.data)) as LogEntry
      messageQueue.push(entry)
      if (resolve) resolve()
    }

    ws.onerror = () => {
      error = new Error(`WebSocket error connecting to ${wsUrl}`)
      cleanup()
    }

    ws.onclose = () => {
      cleanup()
    }

    if (abort) {
      abort.addEventListener('abort', () => cleanup(), { once: true })
    }

    try {
      while (!done || messageQueue.length > 0) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!
          continue
        }
        if (done) break
        await new Promise<void>((r) => {
          resolve = r
        })
        resolve = null
      }
      if (error) throw error
    } finally {
      cleanup()
    }
  }

  async reserveResources(config: Record<string, unknown>): Promise<VmOperationResult> {
    const path = '/control/reserve_resources'
    const url = `${this.nodeUrl}${path}`
    const headers = await this.buildAuthHeaders(path, 'POST')

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    const responseText = await resp.text()

    return {
      status: resp.status,
      response: responseText,
    }
  }
}
