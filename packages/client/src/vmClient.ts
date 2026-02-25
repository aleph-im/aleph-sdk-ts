import { Account } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'
import {
  generateKeyPairSync,
  sign as cryptoSign,
  KeyObject,
} from 'node:crypto'

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

// --- Base58 decoder (for Solana signature conversion) ---

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

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
  result.set(reversed, leadingZeros)
  return result
}

// --- VmClient ---

/**
 * Client for managing VM instances on Aleph CRN (Compute Resource Node)
 * endpoints. Provides authenticated access to instance lifecycle operations
 * including start, stop, reboot, erase, reinstall, backup, and restore.
 *
 * Authentication uses a two-header scheme:
 * - X-SignedPubKey: ephemeral P-256 public key signed by wallet (24h validity)
 * - X-SignedOperation: per-request payload signed by ephemeral key (ES256)
 */
export class VmClient {
  private readonly account: Account
  private readonly nodeUrl: string
  private readonly ephemeralPublicKey: KeyObject
  private readonly ephemeralPrivateKey: KeyObject
  private readonly pubkeyPayload: Record<string, unknown>
  private pubkeySignatureHeader: string | null = null

  constructor(account: Account, nodeUrl: string) {
    this.account = account
    this.nodeUrl = nodeUrl.replace(/\/+$/, '')

    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    })
    this.ephemeralPublicKey = publicKey
    this.ephemeralPrivateKey = privateKey
    this.pubkeyPayload = this.buildPubkeyPayload()
  }

  get nodeDomain(): string {
    const url = new URL(this.nodeUrl)
    if (!url.hostname) {
      throw new Error('Could not parse node domain from URL')
    }
    return url.hostname
  }

  // --- Authentication internals ---

  private buildPubkeyPayload(): Record<string, unknown> {
    const jwk = this.ephemeralPublicKey.export({ format: 'jwk' })
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    return {
      pubkey: jwk,
      alg: 'ECDSA',
      domain: this.nodeDomain,
      address: this.account.address,
      expires: expires.toISOString(),
      chain: this.account.getChain() === Blockchain.SOL ? 'SOL' : 'ETH',
    }
  }

  private async ensurePubkeyHeader(): Promise<string> {
    if (!this.pubkeySignatureHeader) {
      this.pubkeySignatureHeader =
        await this.buildPubkeySignatureHeader()
    }
    return this.pubkeySignatureHeader
  }

  /**
   * Build the X-SignedPubKey header value. The pubkey payload is hex-encoded
   * and signed with the user's wallet key. ETH uses EIP-191 signing over
   * the original JSON bytes; SOL signs the hex string bytes directly.
   */
  private async buildPubkeySignatureHeader(): Promise<string> {
    const jsonString = JSON.stringify(this.pubkeyPayload)
    const hexPayload = Buffer.from(jsonString).toString('hex')
    const isSOL = this.account.getChain() === Blockchain.SOL

    const signable = {
      time: 0,
      sender: this.account.address,
      getVerificationBuffer: () =>
        isSOL ? Buffer.from(hexPayload) : Buffer.from(jsonString),
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
    return '0x' + Buffer.from(bytes).toString('hex')
  }

  /**
   * Sign a control payload with the ephemeral key using ES256
   * (ECDSA P-256 + SHA-256, IEEE P1363 format).
   */
  private signControlPayload(
    payload: Record<string, string>,
  ): string {
    const payloadBytes = Buffer.from(JSON.stringify(payload))
    const signature = cryptoSign('SHA256', payloadBytes, {
      key: this.ephemeralPrivateKey,
      dsaEncoding: 'ieee-p1363',
    })

    return JSON.stringify({
      payload: payloadBytes.toString('hex'),
      signature: signature.toString('hex'),
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

  /**
   * Build authenticated URL and headers for a CRN operation.
   * Useful for custom requests (e.g. file uploads with progress tracking).
   */
  async buildHeaders(
    vmId: string,
    operation: string,
    method: string,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const payload = this.buildControlPayload(vmId, operation, method)
    const signedOperation = this.signControlPayload(payload)
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

  /**
   * Perform an authenticated operation on a VM instance.
   *
   * @param vmId The item hash identifying the VM instance
   * @param operation The operation path segment (use VmOperation or custom string)
   * @param options Optional HTTP method, query params, and JSON body
   */
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
    const { url, headers } = await this.buildHeaders(
      vmId,
      operation,
      method,
    )

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
      const response = await fetch(
        requestUrl.toString(),
        fetchOptions,
      )
      return {
        status: response.status,
        response: await response.text(),
      }
    } catch (error) {
      return { status: null, response: String(error) }
    }
  }

  // --- Instance lifecycle ---

  /**
   * Start a VM instance by notifying the CRN allocation endpoint.
   * Unlike other operations, this does not require authenticated headers.
   */
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

  /**
   * Reinstall a VM instance to its original initial state.
   *
   * @param vmId The item hash identifying the VM instance
   * @param eraseVolumes Whether to erase persistent volumes (default: true)
   */
  async reinstallInstance(
    vmId: string,
    eraseVolumes = true,
  ): Promise<VmOperationResult> {
    const params = eraseVolumes
      ? undefined
      : { erase_volumes: 'false' }
    return this.performOperation(vmId, VmOperation.Reinstall, {
      params,
    })
  }

  // --- Backup ---

  /**
   * Create a backup of a running VM instance.
   *
   * @param vmId The item hash identifying the VM instance
   * @param options.includeVolumes Include persistent volumes in the backup
   * @param options.skipFsfreeze Skip filesystem freeze before backup
   */
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

  /**
   * Get backup information for a VM instance, including download links.
   */
  async getBackup(vmId: string): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Backup, {
      method: 'GET',
    })
  }

  /**
   * Delete a specific backup of a VM instance.
   *
   * @param vmId The item hash identifying the VM instance
   * @param backupId Alphanumeric backup identifier
   */
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

  /**
   * Restore a VM instance from an Aleph volume reference.
   *
   * @param vmId The item hash identifying the VM instance
   * @param volumeRef The item hash of the volume to restore from
   */
  async restoreFromVolume(
    vmId: string,
    volumeRef: string,
  ): Promise<VmOperationResult> {
    return this.performOperation(vmId, VmOperation.Restore, {
      jsonData: { volume_ref: volumeRef },
    })
  }

  /**
   * Restore a VM instance by uploading a rootfs file (QCOW2 format).
   *
   * @param vmId The item hash identifying the VM instance
   * @param rootfsData The rootfs file content as Buffer or Blob
   */
  async restoreFromFile(
    vmId: string,
    rootfsData: Buffer | Blob,
  ): Promise<VmOperationResult> {
    const { url, headers } = await this.buildHeaders(
      vmId,
      VmOperation.Restore,
      'POST',
    )

    const formData = new FormData()
    const blob =
      rootfsData instanceof Blob
        ? rootfsData
        : new Blob([rootfsData], {
            type: 'application/octet-stream',
          })
    formData.append('rootfs', blob)

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

  /**
   * Get the authenticated URL and headers for a restore operation.
   * Useful for custom upload implementations with progress tracking.
   */
  async getRestoreEndpoint(
    vmId: string,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    return this.buildHeaders(vmId, VmOperation.Restore, 'POST')
  }
}
