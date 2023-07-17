import { b58cencode, prefix, validateSignature } from '@taquito/utils'

import { DEFAULT_API_V2 } from '@aleph-sdk/core'
import { EphAccount } from '@aleph-sdk/account'
import * as tezos from '../src/account'

if (!window) {
  require('localstorage-polyfill')
}

async function createEphemeralTezos(): Promise<EphAccount> {
  const { signerAccount, privateKey } = await tezos.NewAccount()
  const publicKey = await signerAccount.GetPublicKey()

  return {
    address: signerAccount.address,
    publicKey,
    privateKey: b58cencode(privateKey, prefix.edsk),
  }
}

describe('Tezos accounts', () => {
  let ephemeralAccount: EphAccount

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    ephemeralAccount = await createEphemeralTezos()
  })

  it('should create a new tezos accounts', async () => {
    const { signerAccount } = await tezos.NewAccount()

    expect(signerAccount.address).not.toBe('')
    expect(await signerAccount.GetPublicKey()).not.toBe('')
  })

  it('should import an tezos accounts using a private key', async () => {
    const { signerAccount, privateKey } = await tezos.NewAccount()
    const account = await tezos.ImportAccountFromPrivateKey(b58cencode(privateKey, prefix.edsk))

    expect(account.address).toStrictEqual(signerAccount.address)
  })

  // @todo: Fix this test! We should unit test the cosmos account features, not to send messages to the network and if so, at least mock the backend....

  // it('should sign a tezos message with InMemorySigner correctly', async () => {
  //   const { privateKey } = ephemeralAccount
  //   if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

  //   const signerAccount = await tezos.ImportAccountFromPrivateKey(privateKey)
  //   const content: { body: string } = {
  //     body: 'Hello World InMemorySigner TEZOS',
  //   }
  //   const msg = await post.Publish({
  //     APIServer: DEFAULT_API_V2,
  //     channel: 'ALEPH-TEST',
  //     inlineRequested: true,
  //     storageEngine: ItemType.ipfs,
  //     account: signerAccount,
  //     postType: 'tezos',
  //     content: content,
  //   })
  //   const sigInfo = JSON.parse(msg.signature)
  //   expect(sigInfo.dAppUrl).not.toBeUndefined()
  //   expect(sigInfo.signingType).toEqual('micheline')
  //   const signature = sigInfo.signature
  //   expect(validateSignature(signature)).toBe(3)
  // })

  // it('should publish a post message correctly', async () => {
  //   const { privateKey } = ephemeralAccount
  //   if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
  //   const signerAccount = await tezos.ImportAccountFromPrivateKey(privateKey)
  //   const content: { body: string } = {
  //     body: 'Hello World TEZOS',
  //   }

  //   const msg = await post.Publish({
  //     channel: 'TEST',
  //     account: signerAccount,
  //     postType: 'tezos',
  //     content: content,
  //   })

  //   expect(msg.item_hash).not.toBeUndefined()
  //   setTimeout(async () => {
  //     const amends = await post.Get({
  //       types: 'tezos',
  //       hashes: [msg.item_hash],
  //     })
  //     expect(amends.posts[0].content).toStrictEqual(content)
  //   })
  // })
})
