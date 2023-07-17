import { EthereumMockProvider } from '@aleph-sdk/evm'
import * as avalanche from '../src/account'
import { EphAccount } from '@aleph-sdk/account'

async function createEphemeralAvax(): Promise<EphAccount> {
  const keypair = await avalanche.getKeyPair()

  return {
    address: keypair.getAddressString(),
    publicKey: keypair.getPublicKey().toString('hex'),
    privateKey: keypair.getPrivateKey().toString('hex'),
  }
}

describe('Avalanche accounts', () => {
  let ephemeralAccount: EphAccount

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralAvax()
  })

  it('should retrieved an avalanche keypair from an hexadecimal private key', async () => {
    const { account, privateKey } = await avalanche.NewAccount()

    if (privateKey) {
      const accountFromPK = await avalanche.ImportAccountFromPrivateKey(privateKey)
      expect(account.address).toBe(accountFromPK.address)
    } else {
      throw Error()
    }
  })

  it('should throw Error to get a Keypair', async () => {
    const fakePrivateKey = 'a'
    const fct = async () => await avalanche.ImportAccountFromPrivateKey(fakePrivateKey)

    await expect(fct).rejects.toThrow('Invalid private key')
  })

  it('should import an ethereum accounts using a provider', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const provider = new EthereumMockProvider({
      address,
      privateKey,
      networkVersion: 31,
    })

    const accountFromProvider = await avalanche.GetAccountFromProvider(provider)
    expect(accountFromProvider.address).toStrictEqual(address)
  })

  it('Should encrypt and decrypt some data with an Avalanche keypair', async () => {
    const { account } = await avalanche.NewAccount()
    const msg = Buffer.from('Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj')

    const c = await account.encrypt(msg)
    const d = await account.decrypt(c)

    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('Should delegate encryption for another account Avalanche account', async () => {
    const accountA = await avalanche.NewAccount()
    const accountB = await avalanche.NewAccount()
    const msg = Buffer.from('Innovation')

    const c = await accountA.account.encrypt(msg, accountB.account.publicKey)
    const d = await accountB.account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)

    const e = await accountA.account.encrypt(msg, accountB.account.publicKey)
    const f = await accountB.account.decrypt(e)
    expect(e).not.toBe(msg)
    expect(f).toStrictEqual(d)
  })

  it('Should encrypt and decrypt some data with an Avalanche account from provider', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const provider = new EthereumMockProvider({
      address,
      privateKey,
      networkVersion: 31,
    })
    const accountFromProvider = await avalanche.GetAccountFromProvider(provider)
    const msg = Buffer.from('Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj')

    const c = await accountFromProvider.encrypt(msg)
    const d = await accountFromProvider.decrypt(c)

    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('Should delegate encrypt and decrypt some data with an Avalanche account from provider', async () => {
    const accountA = ephemeralAccount
    const accountB = ephemeralAccount
    if (!accountB.privateKey || !accountA.privateKey)
      throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const providerA = new EthereumMockProvider({
      address: accountA.address,
      privateKey: accountA.privateKey,
      networkVersion: 31,
    })
    const providerB = new EthereumMockProvider({
      address: accountB.address,
      privateKey: accountB.privateKey,
      networkVersion: 31,
    })

    const accountFromProviderA = await avalanche.GetAccountFromProvider(providerA)
    const accountFromProviderB = await avalanche.GetAccountFromProvider(providerB)
    const msg = Buffer.from('Laŭ Ludoviko Zamenhof bongustas freŝa ĉeĥa manĝaĵo kun spicoj')

    const c = await accountFromProviderA.encrypt(msg, accountFromProviderB)
    const d = await accountFromProviderB.decrypt(c)

    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
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
  //   const accountFromProvider = await avalanche.GetAccountFromProvider(provider)
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

  //   const account = await avalanche.ImportAccountFromPrivateKey(privateKey)
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
})
