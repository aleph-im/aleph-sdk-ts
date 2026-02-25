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
  describe('constructor', () => {
    it('should create a VmClient with account and node URL', () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')
      expect(client.nodeDomain).toBe('crn.example.com')
    })

    it('should strip trailing slashes from node URL', () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com///')
      expect(client.nodeDomain).toBe('crn.example.com')
    })

    it('should throw if node URL has no hostname', () => {
      const account = createMockAccount()
      expect(() => new VmClient(account, 'not-a-url')).toThrow()
    })
  })

  describe('performOperation', () => {
    it('should send authenticated POST request', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

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
      const client = new VmClient(account, 'https://crn.example.com')

      await client.performOperation('vm123', VmOperation.Reinstall, {
        params: { erase_volumes: 'false' },
      })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('erase_volumes=false')
    })

    it('should send JSON body when provided', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.performOperation('vm123', VmOperation.Restore, {
        jsonData: { volume_ref: 'abc123' },
      })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.body).toBe('{"volume_ref":"abc123"}')
      expect(options.headers['Content-Type']).toBe('application/json')
    })

    it('should use GET method when specified', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.performOperation('vm123', VmOperation.Backup, {
        method: 'GET',
      })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.method).toBe('GET')
    })

    it('should return null status on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      const result = await client.performOperation('vm123', VmOperation.Stop)

      expect(result.status).toBeNull()
      expect(result.response).toContain('Network failure')
    })
  })

  describe('instance lifecycle', () => {
    it('stopInstance should POST to stop', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/stop')
      expect(options.method).toBe('POST')
    })

    it('rebootInstance should POST to reboot', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.rebootInstance('vm123')

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/reboot')
    })

    it('eraseInstance should POST to erase', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.eraseInstance('vm123')

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/erase')
    })

    it('expireInstance should POST to expire', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.expireInstance('vm123')

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/expire')
    })

    it('startInstance should POST to allocation notify', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

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
      const client = new VmClient(account, 'https://crn.example.com')

      await client.reinstallInstance('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/reinstall')
      expect(url).not.toContain('erase_volumes')
      expect(options.method).toBe('POST')
    })

    it('should add erase_volumes=false when eraseVolumes is false', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.reinstallInstance('vm123', false)

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('erase_volumes=false')
    })

    it('should not add erase_volumes param when eraseVolumes is true', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.reinstallInstance('vm123', true)

      const [url] = mockFetch.mock.calls[0]
      expect(url).not.toContain('erase_volumes')
    })
  })

  describe('backup operations', () => {
    it('createBackup should POST to backup', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.createBackup('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/backup')
      expect(options.method).toBe('POST')
    })

    it('createBackup should include options as query params', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

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
      const client = new VmClient(account, 'https://crn.example.com')

      await client.getBackup('vm123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/backup')
      expect(options.method).toBe('GET')
    })

    it('deleteBackup should DELETE specific backup', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.deleteBackup('vm123', 'backup-abc_123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/backup/backup-abc_123')
      expect(options.method).toBe('DELETE')
    })

    it('deleteBackup should reject invalid backup IDs', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await expect(
        client.deleteBackup('vm123', '../etc/passwd'),
      ).rejects.toThrow('Invalid backup ID format')
    })
  })

  describe('restore operations', () => {
    it('restoreFromVolume should POST with volume_ref JSON body', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.restoreFromVolume('vm123', 'volume-hash-abc')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/restore')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({ volume_ref: 'volume-hash-abc' })
    })

    it('restoreFromFile should POST multipart form data', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      const fakeData = Buffer.from('fake rootfs data')
      await client.restoreFromFile('vm123', fakeData)

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/control/machine/vm123/restore')
      expect(options.method).toBe('POST')
      expect(options.body).toBeInstanceOf(FormData)
    })

    it('getRestoreEndpoint should return URL and headers', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      const endpoint = await client.getRestoreEndpoint('vm123')

      expect(endpoint.url).toContain('/control/machine/vm123/restore')
      expect(endpoint.headers['X-SignedPubKey']).toBeDefined()
      expect(endpoint.headers['X-SignedOperation']).toBeDefined()
    })
  })

  describe('authentication headers', () => {
    it('should produce valid X-SignedPubKey header', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [, options] = mockFetch.mock.calls[0]
      const pubkeyHeader = JSON.parse(options.headers['X-SignedPubKey'])

      expect(pubkeyHeader.sender).toBe('0xTestAddress1234567890')
      expect(pubkeyHeader.payload).toBeDefined()
      expect(pubkeyHeader.signature).toBe('0xmocksignature123')
      expect(pubkeyHeader.content.domain).toBe('crn.example.com')

      // Verify the payload decodes to valid JSON with expected fields
      const payloadJson = JSON.parse(
        Buffer.from(pubkeyHeader.payload, 'hex').toString(),
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
      const client = new VmClient(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [, options] = mockFetch.mock.calls[0]
      const opHeader = JSON.parse(options.headers['X-SignedOperation'])

      expect(opHeader.payload).toBeDefined()
      expect(opHeader.signature).toBeDefined()

      // Verify the payload decodes to valid control payload
      const payloadJson = JSON.parse(
        Buffer.from(opHeader.payload, 'hex').toString(),
      )
      expect(payloadJson.time).toBeDefined()
      expect(payloadJson.method).toBe('POST')
      expect(payloadJson.path).toBe('/control/machine/vm123/stop')
      expect(payloadJson.domain).toBe('crn.example.com')
    })

    it('should reuse pubkey header across requests', async () => {
      const account = createMockAccount()
      const client = new VmClient(account, 'https://crn.example.com')

      await client.stopInstance('vm1')
      await client.rebootInstance('vm2')

      // account.sign should only be called once (for pubkey header)
      expect(account.sign).toHaveBeenCalledTimes(1)

      // Both requests should have the same X-SignedPubKey
      const header1 = mockFetch.mock.calls[0][1].headers['X-SignedPubKey']
      const header2 = mockFetch.mock.calls[1][1].headers['X-SignedPubKey']
      expect(header1).toBe(header2)
    })

    it('should set chain to SOL for Solana accounts', async () => {
      const account = createMockAccount(Blockchain.SOL)
      // SOL accounts return JSON signature format
      account.sign.mockResolvedValue(
        JSON.stringify({
          signature: '11111111111111111111111111111111',
          publicKey: 'SolPubKey123',
        }),
      )
      const client = new VmClient(account, 'https://crn.example.com')

      await client.stopInstance('vm123')

      const [, options] = mockFetch.mock.calls[0]
      const pubkeyHeader = JSON.parse(options.headers['X-SignedPubKey'])
      const payloadJson = JSON.parse(
        Buffer.from(pubkeyHeader.payload, 'hex').toString(),
      )
      expect(payloadJson.chain).toBe('SOL')
    })
  })
})
