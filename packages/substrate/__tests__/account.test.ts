// import Keyring from '@polkadot/keyring'
import * as substrate from '../src'
import { Blockchain } from '../../core/src'

describe('substrate accounts', () => {
  let newAccount: { account: substrate.DOTAccount; mnemonic: string }

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    newAccount = await substrate.newAccount()
  })

  it('should import a substrate accounts using a mnemonic', async () => {
    const { account, mnemonic } = newAccount
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const accountFromMnemoic = await substrate.importAccountFromMnemonic(mnemonic)

    expect(accountFromMnemoic.address).toStrictEqual(account.address)
    expect(accountFromMnemoic.getChain()).toStrictEqual(Blockchain.DOT)
  })

  //it('should import a substrate accounts using a private key', async () => {
  //  const { account, mnemonic } = newAccount
  //  if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
  //  const account = await substrate.importAccountFromPrivateKey(account.privateKey)
  //
  //  expect(account.getChain()).toStrictEqual(Blockchain.DOT)
  //  expect(account.address).toStrictEqual(address)
  //})
})
