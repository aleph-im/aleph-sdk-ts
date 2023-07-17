import * as bip39 from 'bip39'
import { ethers } from 'ethers'

import { EphAccount } from '@aleph-sdk/account'
import { EthereumMockProvider } from '@aleph-sdk/evm'
import * as ethereum from '../src/account'

async function createEphemeralEth(): Promise<EphAccount> {
  const mnemonic = bip39.generateMnemonic()
  const { address, publicKey, privateKey } = ethers.Wallet.fromMnemonic(mnemonic)

  return {
    address,
    publicKey,
    privateKey: privateKey.substring(2),
    mnemonic,
  }
}

describe('Ethereum accounts', () => {
  let ephemeralAccount: EphAccount
  let ephemeralAccount1: EphAccount

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralEth()
    ephemeralAccount1 = await createEphemeralEth()
  })

  it('should import an ethereum accounts using a mnemonic', () => {
    const { account, mnemonic } = ethereum.NewAccount()
    const accountFromMnemonic = ethereum.ImportAccountFromMnemonic(mnemonic)

    expect(account.address).toStrictEqual(accountFromMnemonic.address)
  })

  it('should import an ethereum accounts using a private key', () => {
    const mnemonic = bip39.generateMnemonic()
    const wallet = ethers.Wallet.fromMnemonic(mnemonic)
    const accountFromPrivate = ethereum.ImportAccountFromPrivateKey(wallet.privateKey)

    expect(wallet.address).toStrictEqual(accountFromPrivate.address)
  })

  it('should import an ethereum accounts using a provider', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const provider = new EthereumMockProvider({
      address,
      privateKey,
      networkVersion: 31,
    })

    const accountFromProvider = await ethereum.GetAccountFromProvider(provider)
    const accountFromPrivate = ethereum.ImportAccountFromPrivateKey(privateKey)

    expect(accountFromProvider.address).toStrictEqual(accountFromPrivate.address)
  })

  it('Should encrypt and decrypt some data with an Ethereum account', async () => {
    const { account } = ethereum.NewAccount()

    const msg = Buffer.from('Innovation')

    const c = await account.encrypt(msg)
    const d = await account.decrypt(c)

    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('Should delegate encryption for another account Ethereum account', async () => {
    const accountA = ethereum.NewAccount()
    const accountB = ethereum.NewAccount()
    const msg = Buffer.from('Innovation')

    const c = await accountA.account.encrypt(msg, accountB.account)
    const d = await accountB.account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)

    const e = await accountA.account.encrypt(msg, accountB.account.publicKey)
    const f = await accountB.account.decrypt(e)
    expect(e).not.toBe(msg)
    expect(f).toStrictEqual(d)
  })

  it('Should delegate encrypt and decrypt some data with a provided Ethereum account', async () => {
    const ephAccountA = ephemeralAccount
    const ephAccountB = ephemeralAccount1
    if (!ephAccountA.privateKey || !ephAccountB.privateKey)
      throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const providerA = new EthereumMockProvider({
      address: ephAccountA.address,
      privateKey: ephAccountA.privateKey,
      networkVersion: 31,
    })
    const providerB = new EthereumMockProvider({
      address: ephAccountB.address,
      privateKey: ephAccountB.privateKey,
      networkVersion: 31,
    })

    const accountFromProviderA = await ethereum.GetAccountFromProvider(providerA)
    const accountFromProviderB = await ethereum.GetAccountFromProvider(providerB)
    const msg = Buffer.from('Innovation')

    const c = await accountFromProviderA.encrypt(msg, accountFromProviderB)
    const d = await accountFromProviderB.decrypt(c)

    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('Should encrypt and decrypt some data with a provided Ethereum account', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const provider = new EthereumMockProvider({
      address,
      privateKey,
      networkVersion: 31,
    })
    const accountFromProvider = await ethereum.GetAccountFromProvider(provider)
    const msg = Buffer.from('Innovation')

    const c = await accountFromProvider.encrypt(msg)
    const d = await accountFromProvider.decrypt(c)

    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('should get the same signed message for each account', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const provider = new EthereumMockProvider({
      address,
      privateKey,
      networkVersion: 31,
    })
    const { account, mnemonic } = ethereum.NewAccount()
    const accountFromProvider = await ethereum.GetAccountFromProvider(provider)
    const accountFromPrivate = await ethereum.ImportAccountFromMnemonic(mnemonic)

    const message = {
      chain: account.GetChain(),
      sender: account.address,
      type: 'post',
      channel: 'TEST',
      confirmed: true,
      signature: 'signature',
      size: 15,
      time: 15,
      item_type: 'storage',
      item_content: 'content',
      item_hash: 'hash',
      content: { address: account.address, time: 15 },
    }

    expect(account.Sign(message)).toStrictEqual(accountFromPrivate.Sign(message))
    expect(account.Sign(message)).toStrictEqual(accountFromProvider.Sign(message))
  })
})
