import * as bip39 from 'bip39'
import { ethers } from 'ethers'

import { EphAccount } from '../../account/src'
import { EthereumMockProvider } from '../../evm/src'
import * as ethereum from '../src'
import { PostMessageBuilder, prepareAlephMessage, ItemType } from '../../message/src'

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
