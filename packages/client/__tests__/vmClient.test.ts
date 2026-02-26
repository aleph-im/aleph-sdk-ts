import { Account } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'

import { hexToBytes, bytesToUtf8 } from '../src/utils/hex'
import { VmClient, VmOperation } from '../src/vmClient'

function createMockAccount(chain: Blockchain = Blockchain.ETH): Account {
  return {
    address: '0xTestAddress1234567890',
    getChain: () => chain,
    sign: jest.fn().mockResolvedValue('0xmocksignature123'),
  } as unknown as Account
}

const TEST_NODE_URL = 'https://crn.example.com'
const TEST_VM_ID = 'abc123def456'

// Mock fetch globally
const mockFetch = jest.fn().mockResolvedValue({
  status: 200,
  text: () => Promise.resolve('OK'),
})
global.fetch = mockFetch

describe('VmClient.create', () => {
  it('should create a VmClient with a valid URL', async () => {
    const account = createMockAccount()
    const client = await VmClient.create(account, TEST_NODE_URL)
    expect(client).toBeInstanceOf(VmClient)
  })

  it('should strip trailing slashes from the node URL', async () => {
    const account = createMockAccount()
    const client = await VmClient.create(account, 'https://crn.example.com///')

    mockFetch.mockClear()
    await client.startInstance(TEST_VM_ID)

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toBe('https://crn.example.com/control/allocation/notify')
  })

  it('should reject an invalid URL', async () => {
    const account = createMockAccount()
    await expect(VmClient.create(account, 'not-a-url')).rejects.toThrow('Invalid node URL')
  })
})

describe('X-SignedPubKey header', () => {
  let client: VmClient
  let account: Account

  beforeEach(async () => {
    account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
  })

  it('should contain sender, payload, signature, and content.domain', async () => {
    const { headers } = await client.buildHeaders(TEST_VM_ID, VmOperation.Stop)

    const pubkeyHeader = JSON.parse(headers['X-SignedPubKey'])

    expect(pubkeyHeader.sender).toBe('0xTestAddress1234567890')
    expect(pubkeyHeader.signature).toBe('0xmocksignature123')
    expect(pubkeyHeader.content.domain).toBe('crn.example.com')
    expect(typeof pubkeyHeader.payload).toBe('string')
  })

  it('should have a payload that hex-decodes to JSON with correct fields', async () => {
    const { headers } = await client.buildHeaders(TEST_VM_ID, VmOperation.Stop)

    const pubkeyHeader = JSON.parse(headers['X-SignedPubKey'])
    const payloadJson = bytesToUtf8(hexToBytes(pubkeyHeader.payload))
    const payload = JSON.parse(payloadJson)

    expect(payload.pubkey).toBeDefined()
    expect(payload.pubkey.kty).toBe('EC')
    expect(payload.pubkey.crv).toBe('P-256')
    expect(payload.alg).toBe('ECDSA')
    expect(payload.domain).toBe('crn.example.com')
    expect(payload.address).toBe('0xTestAddress1234567890')
    expect(payload.chain).toBe('ETH')
    expect(payload.expires).toBeDefined()
  })

  it('should reuse the cached pubkey header across requests', async () => {
    const { headers: h1 } = await client.buildHeaders(TEST_VM_ID, VmOperation.Stop)
    const { headers: h2 } = await client.buildHeaders(TEST_VM_ID, VmOperation.Reboot)

    expect(h1['X-SignedPubKey']).toBe(h2['X-SignedPubKey'])
    expect(account.sign).toHaveBeenCalledTimes(1)
  })
})

describe('X-SignedOperation header', () => {
  let client: VmClient

  beforeEach(async () => {
    const account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
  })

  it('should contain a payload that hex-decodes to JSON with time, method, path, domain', async () => {
    const { headers } = await client.buildHeaders(TEST_VM_ID, VmOperation.Stop, 'POST')

    const opHeader = JSON.parse(headers['X-SignedOperation'])
    const payloadJson = bytesToUtf8(hexToBytes(opHeader.payload))
    const payload = JSON.parse(payloadJson)

    expect(payload.time).toBeDefined()
    expect(payload.method).toBe('POST')
    expect(payload.path).toBe(`/control/machine/${TEST_VM_ID}/stop`)
    expect(payload.domain).toBe('crn.example.com')
  })

  it('should include sender and signature', async () => {
    const { headers } = await client.buildHeaders(TEST_VM_ID, VmOperation.Stop)

    const opHeader = JSON.parse(headers['X-SignedOperation'])
    expect(opHeader.sender).toBe('0xTestAddress1234567890')
    expect(typeof opHeader.signature).toBe('string')
    expect(opHeader.signature.length).toBeGreaterThan(0)
  })
})

describe('SOL chain handling', () => {
  it('should pass SOL chain in the pubkey payload', async () => {
    const solAccount = createMockAccount(Blockchain.SOL)
    ;(solAccount.sign as jest.Mock).mockResolvedValue(JSON.stringify({ signature: '2gPmh' }))
    const client = await VmClient.create(solAccount, TEST_NODE_URL)

    const { headers } = await client.buildHeaders(TEST_VM_ID, VmOperation.Stop)

    const pubkeyHeader = JSON.parse(headers['X-SignedPubKey'])
    const payloadJson = bytesToUtf8(hexToBytes(pubkeyHeader.payload))
    const payload = JSON.parse(payloadJson)

    expect(payload.chain).toBe('SOL')
  })

  it('should call sign with hex-encoded UTF-8 bytes for SOL verification buffer', async () => {
    const solAccount = createMockAccount(Blockchain.SOL)
    // SOL sign returns a JSON signature with base58
    ;(solAccount.sign as jest.Mock).mockResolvedValue(
      JSON.stringify({
        signature: '2gPmh',
      }),
    )

    const client = await VmClient.create(solAccount, TEST_NODE_URL)

    await client.buildHeaders(TEST_VM_ID, VmOperation.Stop)

    expect(solAccount.sign).toHaveBeenCalledTimes(1)
    const signable = (solAccount.sign as jest.Mock).mock.calls[0][0]
    const verBuf = signable.getVerificationBuffer()

    // For SOL, the verification buffer should be UTF-8
    // bytes of the hex-encoded payload string
    const bufStr = verBuf.toString()
    // The hex string should contain only hex characters
    expect(bufStr).toMatch(/^[0-9a-f]+$/)

    // And the pubkey header signature should be
    // 0x-prefixed hex (converted from base58)
    const pubkeyHeader = JSON.parse((await client.buildHeaders(TEST_VM_ID, VmOperation.Stop)).headers['X-SignedPubKey'])
    expect(pubkeyHeader.signature).toMatch(/^0x[0-9a-f]+$/)
  })
})

describe('performOperation', () => {
  let client: VmClient

  beforeEach(async () => {
    const account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('OK'),
    })
  })

  it('should call fetch with correct URL and headers', async () => {
    await client.stopInstance(TEST_VM_ID)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe(`${TEST_NODE_URL}/control/machine/${TEST_VM_ID}/stop`)
    expect(options.method).toBe('POST')
    expect(options.headers['X-SignedPubKey']).toBeDefined()
    expect(options.headers['X-SignedOperation']).toBeDefined()
  })

  it('should return status and response text', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 204,
      text: () => Promise.resolve('No Content'),
    })

    const result = await client.stopInstance(TEST_VM_ID)
    expect(result.status).toBe(204)
    expect(result.response).toBe('No Content')
  })
})

describe('startInstance', () => {
  let client: VmClient

  beforeEach(async () => {
    const account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('OK'),
    })
  })

  it('should POST to /control/allocation/notify without auth headers', async () => {
    await client.startInstance(TEST_VM_ID)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe(`${TEST_NODE_URL}/control/allocation/notify`)
    expect(options.method).toBe('POST')
    expect(options.headers['X-SignedPubKey']).toBeUndefined()

    const body = JSON.parse(options.body)
    expect(body.instance).toBe(TEST_VM_ID)
  })
})

describe('deleteBackup', () => {
  let client: VmClient

  beforeEach(async () => {
    const account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('OK'),
    })
  })

  it('should reject invalid backup IDs', async () => {
    await expect(client.deleteBackup(TEST_VM_ID, 'bad id!')).rejects.toThrow('Invalid backup ID')
  })

  it('should accept valid backup IDs', async () => {
    await client.deleteBackup(TEST_VM_ID, 'backup_2024-01-15')

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/backup/backup_2024-01-15')
  })
})

describe('reinstallInstance', () => {
  let client: VmClient

  beforeEach(async () => {
    const account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('OK'),
    })
  })

  it('should include erase_volumes param when specified', async () => {
    await client.reinstallInstance(TEST_VM_ID, true)

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('erase_volumes=true')
  })

  it('should omit erase_volumes param when not specified', async () => {
    await client.reinstallInstance(TEST_VM_ID)

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).not.toContain('erase_volumes')
  })
})

describe('streamLogs', () => {
  let client: VmClient

  beforeEach(async () => {
    const account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
  })

  it('should build correct WebSocket URL from https node URL', () => {
    const url = client.getStreamLogsUrl(TEST_VM_ID)
    expect(url).toBe(`wss://crn.example.com/control/machine/${TEST_VM_ID}/stream_logs`)
  })

  it('should build correct WebSocket URL from http node URL', async () => {
    const account = createMockAccount()
    const httpClient = await VmClient.create(account, 'http://crn.example.com')
    const url = httpClient.getStreamLogsUrl(TEST_VM_ID)
    expect(url).toBe(`ws://crn.example.com/control/machine/${TEST_VM_ID}/stream_logs`)
  })

  it('should build auth headers with stream_logs operation and GET method', async () => {
    const { url, headers } = await client.buildHeaders(TEST_VM_ID, VmOperation.StreamLogs, 'GET')

    expect(url).toBe(`${TEST_NODE_URL}/control/machine/${TEST_VM_ID}/stream_logs`)

    const opHeader = JSON.parse(headers['X-SignedOperation'])
    const payloadJson = bytesToUtf8(hexToBytes(opHeader.payload))
    const payload = JSON.parse(payloadJson)

    expect(payload.method).toBe('GET')
    expect(payload.path).toBe(`/control/machine/${TEST_VM_ID}/stream_logs`)
    expect(payload.domain).toBe('crn.example.com')

    expect(headers['X-SignedPubKey']).toBeDefined()
    expect(headers['X-SignedOperation']).toBeDefined()
  })
})

describe('reserveResources', () => {
  let client: VmClient

  beforeEach(async () => {
    const account = createMockAccount()
    client = await VmClient.create(account, TEST_NODE_URL)
    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('{"reserved": true}'),
    })
  })

  it('should POST to /control/reserve_resources with auth headers and JSON body', async () => {
    const config = {
      vcpus: 4,
      memory_mib: 2048,
      storage_mib: 10240,
    }
    const result = await client.reserveResources(config)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [calledUrl, options] = mockFetch.mock.calls[0]

    expect(calledUrl).toBe(`${TEST_NODE_URL}/control/reserve_resources`)
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.headers['X-SignedPubKey']).toBeDefined()
    expect(options.headers['X-SignedOperation']).toBeDefined()

    const body = JSON.parse(options.body)
    expect(body.vcpus).toBe(4)
    expect(body.memory_mib).toBe(2048)
    expect(body.storage_mib).toBe(10240)

    expect(result.status).toBe(200)
    expect(result.response).toBe('{"reserved": true}')
  })

  it('should sign the operation with the /control/reserve_resources path', async () => {
    await client.reserveResources({ vcpus: 1 })

    const [, options] = mockFetch.mock.calls[0]
    const opHeader = JSON.parse(options.headers['X-SignedOperation'])
    const payloadJson = bytesToUtf8(hexToBytes(opHeader.payload))
    const payload = JSON.parse(payloadJson)

    expect(payload.path).toBe('/control/reserve_resources')
    expect(payload.method).toBe('POST')
    expect(payload.domain).toBe('crn.example.com')
  })
})
