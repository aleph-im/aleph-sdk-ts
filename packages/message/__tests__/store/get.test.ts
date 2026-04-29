import { readFileSync } from 'fs'

import { StoreMessageClient } from '../../src'
import { hephAccount } from '../_helpers/hephAccount'

export function ArraybufferToString(ab: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(ab) as unknown as number[])
}

describe('Store message retrieval', () => {
  const store = new StoreMessageClient()
  const account = hephAccount(0)
  let seededHash: string
  let seededContent: string

  beforeAll(async () => {
    const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')
    seededContent = fileContent.toString()
    const res = await store.send({
      channel: 'TEST',
      account,
      fileObject: fileContent,
    })
    seededHash = res.content.item_hash
  })

  it('should retrieve a store message correctly', async () => {
    const response = await store.download(seededHash)

    const got = ArraybufferToString(response)

    expect(got).toBe(seededContent)
  })
})
