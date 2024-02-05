import { Keypair } from '@solana/web3.js'

import * as solana from '../src/account'
import { PanthomMockProvider, OfficialMockProvider } from './solanaProvider'
import { EphAccount } from '@aleph-sdk/account'

async function createEphemeralSol(): Promise<EphAccount> {
  const { account, privateKey } = solana.NewAccount()

  return {
    address: account.address,
    publicKey: account.address,
    privateKey: Buffer.from(privateKey).toString('hex'),
  }
}

describe('Solana accounts', () => {
  let ephemeralAccount: EphAccount

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralSol()
  })

  it('should import an solana accounts using a private key', () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
    const accountFromPrivateKey = solana.ImportAccountFromPrivateKey(Buffer.from(privateKey, 'hex'))

    expect(address).toStrictEqual(accountFromPrivateKey.address)
  })

  it('should import an solana accounts using a provider', async () => {
    const randomKeypair = new Keypair()
    const providerPhantom = new PanthomMockProvider(randomKeypair)
    const providerOfficial = new OfficialMockProvider(randomKeypair)
    const accountSecretKey = await solana.ImportAccountFromPrivateKey(randomKeypair.secretKey)
    const accountPhantom = await solana.GetAccountFromProvider(providerPhantom)
    const accountOfficial = await solana.GetAccountFromProvider(providerOfficial)

    expect(accountSecretKey.address).toStrictEqual(accountPhantom.address)
    expect(accountOfficial.address).toStrictEqual(accountPhantom.address)
  })

  it('should get the same signed message for each account', async () => {
    const randomKeypair = new Keypair()
    const providerPhantom = new PanthomMockProvider(randomKeypair)
    const providerOfficial = new OfficialMockProvider(randomKeypair)
    const accountSecretKey = await solana.ImportAccountFromPrivateKey(randomKeypair.secretKey)
    const accountPhantom = await solana.GetAccountFromProvider(providerPhantom)
    const accountOfficial = await solana.GetAccountFromProvider(providerOfficial)

    const message = {
      chain: accountSecretKey.GetChain(),
      sender: accountSecretKey.address,
      type: 'post',
      channel: 'TEST',
      confirmed: true,
      signature: 'signature',
      size: 15,
      time: 15,
      item_type: 'storage',
      item_content: 'content',
      item_hash: 'hash',
      content: { address: accountSecretKey.address, time: 15 },
    }

    expect(accountSecretKey.Sign(message)).toStrictEqual(accountPhantom.Sign(message))
    expect(accountOfficial.Sign(message)).toStrictEqual(accountPhantom.Sign(message))
  })

  // @todo: Fix this test! We should unit test the cosmos account features, not to send messages to the network and if so, at least mock the backend....

  // it('should publish a post message correctly', async () => {
  //   const { privateKey } = ephemeralAccount
  //   if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
  //   const account = solana.ImportAccountFromPrivateKey(Buffer.from(privateKey, 'hex'))

  //   const content: { body: string } = {
  //     body: 'This message was posted from the typescript-SDK test suite with SOL',
  //   }

  //   const msg = await post.Publish({
  //     channel: 'TEST',
  //     account: account,
  //     postType: 'solana',
  //     content: content,
  //   })

  //   expect(msg.item_hash).not.toBeUndefined()
  //   setTimeout(async () => {
  //     const amends = await post.Get({
  //       types: 'solana',
  //       hashes: [msg.item_hash],
  //     })
  //     expect(amends.posts[0].content).toStrictEqual(content)
  //   })
  // })
})
