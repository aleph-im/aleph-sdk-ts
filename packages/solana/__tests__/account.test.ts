// eslint-disable-next-line import/no-unresolved
import { E2EWalletAdapter } from '@jet-lab/e2e-react-adapter'
import { Keypair, PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'

import { EphAccount } from '../../account/src'
//import { ItemType, PostMessageBuilder, prepareAlephMessage } from '../../message/src'
import * as solana from '../src'

type WalletSignature = {
  signature: Uint8Array
  publicKey: string
}

class SolanaMockProvider {
  public provider
  public publicKey: PublicKey
  public secretKey: Uint8Array
  public connected: boolean

  constructor(randomKeypair: Keypair) {
    this.provider = new E2EWalletAdapter({ keypair: randomKeypair })
    this.secretKey = randomKeypair.secretKey
    this.publicKey = this.provider.publicKey
    this.connected = this.provider.connected
  }

  connect(): Promise<void> {
    return this.provider.connect()
  }
}

export class PhantomMockProvider extends SolanaMockProvider {
  signMessage(message: Uint8Array): Promise<WalletSignature> {
    const signature = nacl.sign.detached(message, this.secretKey)
    return Promise.resolve({ signature: signature, publicKey: this.publicKey.toString() })
  }
}

export class OfficialMockProvider extends SolanaMockProvider {
  signMessage(message: Uint8Array): Promise<Uint8Array> {
    const signature = nacl.sign.detached(message, this.secretKey)
    return Promise.resolve(signature)
  }
}

async function createEphemeralSol(): Promise<EphAccount> {
  const { account, privateKey } = solana.newAccount()

  return {
    address: account.address,
    publicKey: account.address,
    privateKey: Buffer.from(privateKey).toString('hex'),
    mnemonic: '',
  }
}

describe('Solana accounts', () => {
  let ephemeralAccount: EphAccount

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralSol()
  })

  it('should create a new account with a private key and address', () => {
    const { account, privateKey } = solana.newAccount()

    expect(account).toBeInstanceOf(solana.SOLAccount)
    expect(privateKey).toBeInstanceOf(Uint8Array)
    expect(privateKey.length).toBeGreaterThan(0)
  })

  it('should import an solana accounts using a private key', () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
    const accountFromPrivateKey = solana.importAccountFromPrivateKey(Buffer.from(privateKey, 'hex'))

    expect(address).toStrictEqual(accountFromPrivateKey.address)
  })

  it('should import an solana accounts using a provider', async () => {
    const randomKeypair = new Keypair()
    const providerPhantom = new PhantomMockProvider(randomKeypair)
    const providerOfficial = new OfficialMockProvider(randomKeypair)
    const accountSecretKey = await solana.importAccountFromPrivateKey(randomKeypair.secretKey)
    const accountPhantom = await solana.getAccountFromProvider(providerPhantom)
    const accountOfficial = await solana.getAccountFromProvider(providerOfficial)

    expect(accountSecretKey.address).toStrictEqual(accountPhantom.address)
    expect(accountOfficial.address).toStrictEqual(accountPhantom.address)
  })

  // TODO: fix this
  /* it('should get the same signed message for each account', async () => {
    const randomKeypair = new Keypair()
    const providerPhantom = new PhantomMockProvider(randomKeypair)
    const providerOfficial = new OfficialMockProvider(randomKeypair)
    const accountSecretKey = await solana.importAccountFromPrivateKey(randomKeypair.secretKey)
    const accountPhantom = await solana.getAccountFromProvider(providerPhantom)
    const accountOfficial = await solana.getAccountFromProvider(providerOfficial)

    const builtMessage = PostMessageBuilder({
      account: accountSecretKey,
      channel: 'TEST',
      storageEngine: ItemType.inline,
      timestamp: Date.now() / 1000,
      content: { address: accountSecretKey.address, time: 15, type: '' },
    })

    const hashedMessage = await prepareAlephMessage({ message: builtMessage })

    expect(accountSecretKey.sign(hashedMessage)).toStrictEqual(accountPhantom.sign(hashedMessage))
    expect(accountOfficial.sign(hashedMessage)).toStrictEqual(accountPhantom.sign(hashedMessage))
  }) */

  // @todo: Fix this test! We should unit test the cosmos account features, not to send messages to the network and if so, at least mock the backend....

  // it('should publish a post message correctly', async () => {
  //   const { privateKey } = ephemeralAccount
  //   if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
  //   const account = solana.importAccountFromPrivateKey(Buffer.from(privateKey, 'hex'))

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
