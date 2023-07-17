import { EphAccount } from '@aleph-sdk/account'
import Keyring from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { generateMnemonic } from '@polkadot/util-crypto/mnemonic/bip39'
import * as substrate from '../src/account'
import { Blockchain } from '@aleph-sdk/core'

async function createEphemeralPolkadot(): Promise<EphAccount> {
  const mnemonic = generateMnemonic()
  const keyRing = new Keyring({ type: 'sr25519' })

  await cryptoWaitReady()

  const account = keyRing.createFromUri(mnemonic, { name: 'sr25519' })

  return {
    address: account.address,
    publicKey: 'aaa',
    mnemonic: mnemonic,
  }
}

describe('substrate accounts', () => {
  let ephemeralAccount: EphAccount

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    ephemeralAccount = await createEphemeralPolkadot()
  })

  it('should import a substrate accounts using a mnemonic', async () => {
    const { address, mnemonic } = ephemeralAccount
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const accountFromMnemoic = await substrate.ImportAccountFromMnemonic(mnemonic)

    expect(accountFromMnemoic.address).toStrictEqual(address)
    expect(accountFromMnemoic.GetChain()).toStrictEqual(Blockchain.DOT)
  })

  it('should import a substrate accounts using a private key', async () => {
    const { address, privateKey } = ephemeralAccount
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
    const account = await substrate.ImportAccountFromPrivateKey(privateKey)

    expect(account.GetChain()).toStrictEqual(Blockchain.DOT)
    expect(account.address).toStrictEqual(address)
  })

  it('Should encrypt and decrypt content with substrate', async () => {
    const { account } = await substrate.NewAccount()
    const msg = Buffer.from('DOTDOT')

    const c = account.encrypt(msg)
    const d = account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })
})
