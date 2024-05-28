import { StoreMessageClient } from '../../src'
import * as ethereum from '../../../ethereum/src'
import { readFileSync } from 'fs'

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

    const hash = await store.send({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
      extraFields,
    })

    const response = await store.download(hash.content.item_hash)

    const got = ArraybufferToString(response)
    const expected = 'y'

    expect(got).toBe(expected)
    expect(hash.content.extra_fields).toEqual(extraFields)
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
})
