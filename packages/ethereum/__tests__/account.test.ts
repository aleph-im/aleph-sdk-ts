import { EphAccount } from '../../account/src'
import { createEphemeralEth, EthereumMockProvider } from '../../evm/src'
import { ItemType, PostMessageBuilder, prepareAlephMessage } from '../../message/src'
import * as ethereum from '../src'

describe('Ethereum accounts', () => {
  let ephemeralAccount: EphAccount

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralEth()
  })

  it('should import an ethereum account using a mnemonic', () => {
    const accountFromMnemonic = ethereum.importAccountFromMnemonic(ephemeralAccount.mnemonic)

    expect(ephemeralAccount.address).toStrictEqual(accountFromMnemonic.address)
  })

  it('should import an ethereum account using a private key', () => {
    const accountFromPrivate = ethereum.importAccountFromPrivateKey(ephemeralAccount.privateKey)

    expect(ephemeralAccount.address).toStrictEqual(accountFromPrivate.address)
  })

  it('should import an ethereum account using a provider', async () => {
    const mockProvider = new EthereumMockProvider({
      address: '0x1234567890AbcdEF1234567890aBcdef12345678',
      privateKey: '0x1234567890AbcdEF1234567890aBcdef12345678',
      networkVersion: 1,
    })
    const accountFromProvider = await ethereum.getAccountFromProvider(mockProvider)
    expect(accountFromProvider.address).toStrictEqual(mockProvider.getAddress())
  })

  it('should get the same signed message for each account', async () => {
    const accountFromMnemonic = ethereum.importAccountFromMnemonic(ephemeralAccount.mnemonic!)
    const accountFromPrivate = ethereum.importAccountFromPrivateKey(ephemeralAccount.privateKey!)

    const builtMessage = PostMessageBuilder({
      account: accountFromMnemonic,
      channel: 'TEST',
      storageEngine: ItemType.inline,
      timestamp: Date.now() / 1000,
      content: { address: accountFromMnemonic.address, time: 15, type: '' },
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
    })

    expect(accountFromMnemonic.sign(hashedMessage)).toStrictEqual(accountFromPrivate.sign(hashedMessage))
  })

  it('should retrieve ALEPH balance for each account', async () => {
    const accountFromMnemonic = ethereum.importAccountFromMnemonic(ephemeralAccount.mnemonic!)
    const accountFromPrivate = ethereum.importAccountFromPrivateKey(ephemeralAccount.privateKey!)

    expect(await accountFromMnemonic.getALEPHBalance()).toStrictEqual(await accountFromPrivate.getALEPHBalance())
  })
})
