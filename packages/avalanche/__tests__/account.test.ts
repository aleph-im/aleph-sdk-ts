import { Decimal } from 'decimal.js'

import { EphAccount } from '../../account/src'
import { EthereumMockProvider } from '../../evm/src'
import { buildMessage, HashedMessage, ItemType, MessageType, PostContent, prepareAlephMessage } from '../../message/src'
import * as avalanche from '../src'

async function createEphemeralAvax(): Promise<EphAccount> {
  const keypair = await avalanche.getKeyPair()

  return {
    address: avalanche.getEVMAddress(keypair),
    publicKey: keypair.getPublicKey().toString('hex'),
    privateKey: keypair.getPrivateKey().toString('hex'),
    mnemonic: '',
  }
}

describe('Avalanche accounts', () => {
  let ephemeralAccount: EphAccount

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralAvax()
  })

  it('should import an avalanche account using a private key', async () => {
    const accountFromPrivate = await avalanche.importAccountFromPrivateKey(ephemeralAccount.privateKey)

    expect(ephemeralAccount.address).toStrictEqual(accountFromPrivate.address)
  })

  it('should retrieved an avalanche keypair from an hexadecimal private key', async () => {
    const { account, privateKey } = await avalanche.newAccount()

    if (privateKey) {
      const accountFromPK = await avalanche.importAccountFromPrivateKey(privateKey)
      expect(account.address).toBe(accountFromPK.address)
    } else {
      throw Error()
    }
  })

  it('should throw Error to get a Keypair', async () => {
    const fakePrivateKey = 'a'
    const fct = async () => await avalanche.importAccountFromPrivateKey(fakePrivateKey, avalanche.ChainType.X_CHAIN)

    await expect(fct).rejects.toThrow('Invalid private key')
  })

  it('should import an avalanche account using a provider', async () => {
    const mockProvider = new EthereumMockProvider({
      address: '0x1234567890AbcdEF1234567890aBcdef12345678',
      privateKey: '0x1234567890AbcdEF1234567890aBcdef12345678',
      networkVersion: 43114,
    })
    const accountFromProvider = await avalanche.getAccountFromProvider(mockProvider)
    expect(accountFromProvider.address).toStrictEqual(mockProvider.getAddress())
  })

  // @todo: Fix this test! We should unit test the cosmos account features, not to send messages to the network and if so, at least mock the backend....

  // it('should publish a post message correctly with an account from a provider', async () => {
  //   const { address, privateKey } = ephemeralAccount
  //   if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

  //   const provider = new EthereumMockProvider({
  //     address,
  //     privateKey,
  //     networkVersion: 31,
  //   })
  //   const accountFromProvider = await avalanche.getAccountFromProvider(provider)
  //   const content: { body: string } = {
  //     body: 'This message was posted from the typescript-SDK test suite',
  //   }

  //   const msg = await post.Publish({
  //     channel: 'TEST',
  //     account: accountFromProvider,
  //     postType: 'avalanche',
  //     content: content,
  //   })

  //   expect(msg.item_hash).not.toBeUndefined()
  //   setTimeout(async () => {
  //     const amends = await post.Get({
  //       types: 'avalanche',
  //       hashes: [msg.item_hash],
  //     })
  //     expect(amends.posts[0].content).toStrictEqual(content)
  //   })
  // })

  // it('should publish a post message correctly', async () => {
  //   const { privateKey } = ephemeralAccount
  //   if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

  //   const account = await avalanche.importAccountFromPrivateKey(privateKey)
  //   const content: { body: string } = {
  //     body: 'This message was posted from the typescript-SDK test suite',
  //   }

  //   const msg = await post.Publish({
  //     channel: 'TEST',
  //     account: account,
  //     postType: 'avalanche',
  //     content: content,
  //   })

  //   expect(msg.item_hash).not.toBeUndefined()
  //   setTimeout(async () => {
  //     const amends = await post.Get({
  //       types: 'avalanche',
  //       hashes: [msg.item_hash],
  //     })
  //     expect(amends.posts[0].content).toStrictEqual(content)
  //   })
  // })

  it('Should success to verif the authenticity of a signature', async () => {
    const { account } = await avalanche.newAccount()

    const builtMessage = buildMessage(
      {
        account,
        channel: 'TEST',
        storageEngine: ItemType.inline,
        timestamp: Date.now() / 1000,
        content: { address: account.address, time: 15, type: '' },
      },
      MessageType.post,
    )

    const hashedMessage = await prepareAlephMessage({ message: builtMessage })
    if (!account.publicKey) throw Error()
    const signature = await account.sign(hashedMessage)
    const verif = await avalanche.verifyAvalanche(hashedMessage.getVerificationBuffer(), signature, account.publicKey)
    const verifB = await avalanche.verifyAvalanche(hashedMessage, signature, account.publicKey)

    expect(verif).toStrictEqual(true)
    expect(verifB).toStrictEqual(true)
  })

  it('Should fail to verif the authenticity of a signature', async () => {
    const { account: account } = await avalanche.newAccount()
    const { account: fakeAccount } = await avalanche.newAccount()

    const message = buildMessage(
      {
        account,
        channel: 'TEST',
        timestamp: 15,
        storageEngine: ItemType.storage,
        content: { address: account.address, time: 15, type: '' },
      },
      MessageType.post,
    )
    const hashedMessage = await prepareAlephMessage({ message })
    const fakeMessage = {
      ...hashedMessage,
      item_hash: 'FAKE',
      getVerificationBuffer(): Buffer {
        return Buffer.from('FAKE')
      },
    } as HashedMessage<PostContent<unknown>>
    if (!account.publicKey || !fakeAccount.publicKey) throw Error()
    const fakeSignature = await account.sign(fakeMessage)
    const verif = await avalanche.verifyAvalanche(hashedMessage, fakeSignature, account.publicKey)
    const verifB = await avalanche.verifyAvalanche(fakeMessage, fakeSignature, fakeAccount.publicKey)

    expect(verif).toStrictEqual(false)
    expect(verifB).toStrictEqual(false)
  })

  it('should retrieve ALEPH balance for each account', async () => {
    const accountFromPrivate = await avalanche.importAccountFromPrivateKey(ephemeralAccount.privateKey!)

    expect(await accountFromPrivate.getALEPHBalance()).toStrictEqual(new Decimal(0))
  })
})
