import { readFileSync } from 'fs'

import * as ethereum from '../../../ethereum/src'
import { StoreMessageClient } from '../../src'

export function ArraybufferToString(ab: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(ab) as unknown as number[])
}

describe('Store message publish', () => {
  const store = new StoreMessageClient()

  it('should store a file and retrieve it correctly', async () => {
    const { account } = ethereum.newAccount()
    const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')

    const extraFields: Record<string, unknown> = {
      key1: 'value1',
      key2: 123,
    }

    const metadata: Record<string, unknown> = {
      name: 'testFile.txt',
    }

    const hash = await store.send({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
      extraFields,
      metadata,
    })

    const response = await store.download(hash.content.item_hash)

    const got = ArraybufferToString(response)
    const expected = 'y'

    expect(got).toBe(expected)
    expect(hash.content.extra_fields).toEqual(extraFields)
    expect(hash.content.metadata).toEqual(metadata)
  })

  it('should pin a file and retrieve it correctly', async () => {
    const { account } = ethereum.newAccount()
    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'

    const hash = await store.pin({
      channel: 'TEST',
      account: account,
      fileHash: helloWorldHash,
    })

    const response = await store.download(hash.content.item_hash)

    const got = ArraybufferToString(response)
    const expected = 'hello world!'

    expect(got).toBe(expected)
  })

  it('should throw Error to pin a file at runtime', async () => {
    const { account } = ethereum.newAccount()

    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'

    await expect(
      store.send({
        channel: 'TEST',
        account: account,
        fileHash: helloWorldHash,
      }),
    ).rejects.toThrow('You must choose ipfs to pin the file.')
  })

  it('should calculate the estimated size of a file passing "estimated_size_mib" property', async () => {
    const { account } = ethereum.newAccount()
    const fileContent = readFileSync('./packages/message/__tests__/store/heavyTestFile.txt')

    const cost = await store.getEstimatedCost({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
      estimated_size_mib: 20,
    })

    expect(cost).toBeDefined()
    expect(cost.cost).toBe('6.666666660000000000')
  })

  it('should calculate the estimated size of a file from the fileObject', async () => {
    const { account } = ethereum.newAccount()
    // @note: 1MiB ~file size
    const fileContent = readFileSync('./packages/message/__tests__/store/heavyTestFile.txt')

    const cost = await store.getEstimatedCost({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
    })

    expect(cost).toBeDefined()
    expect(cost.cost).toBe('0.333333333000000000')
  })

  it('should get the cost of an existing message', async () => {
    const cost = await store.getCost('9d6fa0355f946b60f15a56f3510551fbbb5b3ea2e38adf098d80f4dc0d3647ed')

    expect(cost).toBeDefined()
    expect(cost.cost).toBe('0.059805234213469505')
  })
})
