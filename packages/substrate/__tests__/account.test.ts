// import Keyring from '@polkadot/keyring'
import * as substrate from '../src/account'
import { Blockchain } from '../../core/src'

describe('substrate accounts', () => {
  let newAccount: { account: substrate.DOTAccount; mnemonic: string }

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    newAccount = await substrate.NewAccount()
  })

  it('should import a substrate accounts using a mnemonic', async () => {
    const { account, mnemonic } = newAccount
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const accountFromMnemoic = await substrate.ImportAccountFromMnemonic(mnemonic)

    expect(accountFromMnemoic.address).toStrictEqual(account.address)
    expect(accountFromMnemoic.getChain()).toStrictEqual(Blockchain.DOT)
  })

  //it('should import a substrate accounts using a private key', async () => {
  //  const { account, mnemonic } = newAccount
  //  if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
  //  const account = await substrate.ImportAccountFromPrivateKey(account.privateKey)
  //
  //  expect(account.getChain()).toStrictEqual(Blockchain.DOT)
  //  expect(account.address).toStrictEqual(address)
  //})

  it('Should encrypt and decrypt content with substrate', async () => {
    const { account } = await substrate.NewAccount()
    const msg = Buffer.from('DOTDOT')

    const c = account.encrypt(msg)
    const d = account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })
})
