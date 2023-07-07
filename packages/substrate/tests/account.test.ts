import { EphAccount } from '@aleph-sdk/account'
import Keyring from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { generateMnemonic } from '@polkadot/util-crypto/mnemonic/bip39'

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
