import { ItemType, StoreMessageClient } from '../../src'
import { DEFAULT_API_V2 } from '../../../core/src'
import * as ethereum from '../../../ethereum/src'
import { readFileSync } from 'fs'

export function ArraybufferToString(ab: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(ab) as unknown as number[])
}

describe('Store message publish', () => {
  const store = new StoreMessageClient()

  it('should store a file and retrieve it correctly', async () => {
    const { account } = ethereum.NewAccount()
    const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')

    const hash = await store.send({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
    })

    const response = await store.get({
      fileHash: hash.content.item_hash,
      apiServer: DEFAULT_API_V2,
    })

    const got = ArraybufferToString(response)
    const expected = 'y'

    expect(got).toBe(expected)
  })

  it('should pin a file and retrieve it correctly', async () => {
    const { account } = ethereum.NewAccount()
    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'

    const hash = await store.pin({
      channel: 'TEST',
      account: account,
      fileHash: helloWorldHash,
    })

    const response = await store.get({
      fileHash: hash.content.item_hash,
      apiServer: DEFAULT_API_V2,
    })

    const got = ArraybufferToString(response)
    const expected = 'hello world!'

    expect(got).toBe(expected)
  })

  it('should throw Error to pin a file at runtime', async () => {
    const { account } = ethereum.NewAccount()

    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'
    const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')

    await expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      store.send({
        channel: 'TEST',
        account: account,
        fileObject: fileContent,
        fileHash: helloWorldHash,
      }),
    ).rejects.toThrow("You can't pin a file and upload it at the same time.")

    await expect(
      store.send({
        channel: 'TEST',
        account: account,
        fileHash: helloWorldHash,
      }),
    ).rejects.toThrow('You must choose ipfs to pin file.')

    await expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      store.send({
        channel: 'TEST',
        apiServer: DEFAULT_API_V2,
        account: account,
        storageEngine: ItemType.storage,
      }),
    ).rejects.toThrow('You need to specify a File to upload or a Hash to pin.')
  })
})
