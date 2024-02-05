import * as bip32 from 'bip32'
import * as bip39 from 'bip39'

import { Blockchain } from '@aleph-sdk/core'
import { EphAccount } from '@aleph-sdk/account'
import * as nuls2 from '../src/account'

async function createEphemeralNULS2(): Promise<EphAccount> {
  const account = await nuls2.NewAccount()
  const v = await bip39.mnemonicToSeed(account.mnemonic)
  const b = bip32.fromSeed(v)

  if (!b || !b.privateKey) throw new Error('could not import from mnemonic')
  const privateKey = b.privateKey.toString('hex')

  if (!account.account.publicKey) throw Error('[Ephemeral Account generation] - Error while creating Nuls2 Account')

  return {
    address: account.account.address,
    publicKey: account.account.publicKey,
    mnemonic: account.mnemonic,
    privateKey,
  }
}

describe('NULS2 accounts', () => {
  let ephemeralAccount: EphAccount

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    ephemeralAccount = await createEphemeralNULS2()
  })

  it('should import a NULS2 accounts using a mnemonic', async () => {
    const { address, mnemonic } = ephemeralAccount
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const accountFromMnemoic = await nuls2.ImportAccountFromMnemonic(mnemonic)

    expect(accountFromMnemoic.address).toStrictEqual(address)
    expect(accountFromMnemoic.GetChain()).toStrictEqual(Blockchain.NULS2)
  })

  it('should import a NULS2 accounts using a private key', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
    const account = await nuls2.ImportAccountFromPrivateKey(privateKey)

    expect(account.GetChain()).toStrictEqual(Blockchain.NULS2)
    expect(account.address).toStrictEqual(address)
  })

  it("should change NULS2 account address' prefix", async () => {
    const { mnemonic, privateKey } = ephemeralAccount
    if (!mnemonic || !privateKey) throw Error('Can not retrieve mnemonic or privateKey inside ephemeralAccount.json')
    const accountOne = await nuls2.ImportAccountFromMnemonic(mnemonic, { prefix: 'TEST' })
    const accountTwo = await nuls2.ImportAccountFromPrivateKey(privateKey)

    const accountOnePrefix = accountOne.address.substring(0, 3)
    const accountOneAddress = accountOne.address.substring(4, accountOne.address.length)
    const accountTwoPrefix = accountTwo.address.substring(0, 3)
    const accountTwoAddress = accountTwo.address.substring(4, accountTwo.address.length)

    expect(accountOnePrefix).not.toBe(accountTwoPrefix)
    expect(accountOneAddress).toStrictEqual(accountTwoAddress)
  })

  // @todo: Fix this test! We should unit test the cosmos account features, not to send messages to the network and if so, at least mock the backend....

  // it('should publish a post message correctly', async () => {
  //   const { privateKey } = ephemeralAccount
  //   if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
  //   const account = await nuls2.ImportAccountFromPrivateKey(privateKey)
  //   const content: { body: string } = {
  //     body: 'This message was posted from the typescript-SDK test suite with ETH',
  //   }

  //   const msg = await post.Publish({
  //     channel: 'TEST',
  //     account: account,
  //     postType: 'nuls2',
  //     content: content,
  //   })

  //   expect(msg.item_hash).not.toBeUndefined()
  //   setTimeout(async () => {
  //     const amends = await post.Get({
  //       types: 'nuls2',
  //       hashes: [msg.item_hash],
  //     })
  //     expect(amends.posts[0].content).toStrictEqual(content)
  //   })
  // })

  it('Should encrypt and decrypt content with NULS2', async () => {
    const { account } = await nuls2.NewAccount()
    const msg = Buffer.from('Nuuullss2')

    const c = await account.encrypt(msg)
    const d = await account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('Should delegate encrypt and decrypt content with NULS2', async () => {
    const accountA = await nuls2.NewAccount()
    const accountB = await nuls2.NewAccount()
    const msg = Buffer.from('Nuuullss2')

    const c = await accountA.account.encrypt(msg, accountB.account)
    const d = await accountB.account.decrypt(c)

    const e = await accountA.account.encrypt(msg, accountB.account.publicKey)
    const f = await accountB.account.decrypt(c)

    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
    expect(e).not.toBe(msg)
    expect(d).toStrictEqual(f)
  })
})
