import { StoreMessageClient } from '../../'
import { DEFAULT_API_V2 } from '../../../core/'

export function ArraybufferToString(ab: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(ab) as unknown as number[])
}

describe('Store message retrieval', () => {
  const store = new StoreMessageClient()

  it('should retrieve a store message correctly', async () => {
    const response = await store.get({
      fileHash: 'QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L',
      apiServer: DEFAULT_API_V2,
    })

    const got = ArraybufferToString(response)
    const expected = 'This is just a test.'

    expect(got).toBe(expected)
  })

  it('should retrieve a store message without an apiServer argument', async () => {
    const response = await store.get({
      fileHash: 'QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L',
    })

    const got = ArraybufferToString(response)
    const expected = 'This is just a test.'

    expect(got).toBe(expected)
  })
})
