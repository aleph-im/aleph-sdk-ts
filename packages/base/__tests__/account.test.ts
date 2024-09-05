import * as bip39 from 'bip39'
import { ethers } from 'ethers'

import * as base from '../src'
import { PostMessageBuilder, prepareAlephMessage, ItemType } from '../../message/src'
import { EthereumMockProvider } from '@aleph-sdk/evm'
import { EphAccount } from '@aleph-sdk/account'

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

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralEth()
  })

  it('should import a base account using a mnemonic', () => {
    const { account, mnemonic } = base.newAccount()
    const accountFromMnemonic = base.importAccountFromMnemonic(mnemonic)

    expect(account.address).toStrictEqual(accountFromMnemonic.address)
  })

  it('should import a base account using a private key', () => {
    const mnemonic = bip39.generateMnemonic()
    const wallet = ethers.Wallet.fromMnemonic(mnemonic)
    const accountFromPrivate = base.importAccountFromPrivateKey(wallet.privateKey)

    expect(wallet.address).toStrictEqual(accountFromPrivate.address)
  })

  it('should import a base account using a provider', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const provider = new EthereumMockProvider({
      address,
      privateKey,
      networkVersion: 31,
    })

    const accountFromProvider = await base.getAccountFromProvider(provider)
    const accountFromPrivate = base.importAccountFromPrivateKey(privateKey)

    expect(accountFromProvider.address).toStrictEqual(accountFromPrivate.address)
  })

  it('should get the same signed message for each account', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const provider = new EthereumMockProvider({
      address,
      privateKey,
      networkVersion: 31,
    })
    const { account, mnemonic } = base.newAccount()
    const accountFromProvider = await base.getAccountFromProvider(provider)
    const accountFromPrivate = await base.importAccountFromMnemonic(mnemonic)

    const builtMessage = PostMessageBuilder({
      account,
      channel: 'TEST',
      storageEngine: ItemType.inline,
      timestamp: Date.now() / 1000,
      content: { address: account.address, time: 15, type: '' },
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
    })

    expect(account.sign(hashedMessage)).toStrictEqual(accountFromPrivate.sign(hashedMessage))
    expect(account.sign(hashedMessage)).toStrictEqual(accountFromProvider.sign(hashedMessage))
  })
})
