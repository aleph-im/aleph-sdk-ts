import { ethereum, store } from '../../index'
import { DEFAULT_API_V2 } from '../../../src/global'
import { ItemType } from '../../../src/messages/message'
import fs, { readFileSync } from 'fs'
import { EphAccountList } from '../../testAccount/entryPoint'

export function ArraybufferToString(ab: ArrayBuffer): string {
  return new TextDecoder().decode(ab)
}

describe('Store message publish', () => {
  let ephemeralAccount: EphAccountList

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    if (!fs.existsSync('./tests/testAccount/ephemeralAccount.json'))
      throw Error('[Ephemeral Account Generation] - Error, please run: npm run test:regen')
    ephemeralAccount = await import('../../testAccount/ephemeralAccount.json')
    if (!ephemeralAccount.eth.privateKey) throw Error('[Ephemeral Account Generation] - Generated Account corrupted')
  })

  it('should store a file and retrieve it correctly', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)
    const fileContent = readFileSync('./tests/messages/store/testFile.txt')

    const hash = await store.Publish({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
    })

    const response = await store.Get({
      fileHash: hash.content.item_hash,
      APIServer: DEFAULT_API_V2,
    })

    const got = ArraybufferToString(response)
    const expected = 'y'

    expect(got).toBe(expected)
  })

  it('should pin a file and retrieve it correctly', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)
    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'

    const hash = await store.Pin({
      channel: 'TEST',
      account: account,
      fileHash: helloWorldHash,
    })

    const response = await store.Get({
      fileHash: hash.content.item_hash,
      APIServer: DEFAULT_API_V2,
    })

    const got = ArraybufferToString(response)
    const expected = 'hello world!'

    expect(got).toBe(expected)
  })

  it('should throw Error to pin a file at runtime', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)

    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'
    const fileContent = readFileSync('./tests/messages/store/testFile.txt')

    await expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      store.Publish({
        channel: 'TEST',
        account: account,
        fileObject: fileContent,
        fileHash: helloWorldHash,
      }),
    ).rejects.toThrow("You can't pin a file and upload it at the same time.")

    await expect(
      store.Publish({
        channel: 'TEST',
        account: account,
        fileHash: helloWorldHash,
      }),
    ).rejects.toThrow('You must choose ipfs to pin file.')

    await expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      store.Publish({
        channel: 'TEST',
        APIServer: DEFAULT_API_V2,
        account: account,
        storageEngine: ItemType.storage,
      }),
    ).rejects.toThrow('You need to specify a File to upload or a Hash to pin.')
  })
})
