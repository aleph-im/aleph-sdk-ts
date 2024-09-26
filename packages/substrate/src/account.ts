import { Account, SignableMessage } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'
import { type InjectedExtension } from '@polkadot/extension-inject/types'
import { Keyring } from '@polkadot/keyring'
import { type KeyringPair } from '@polkadot/keyring/types'
import { stringToHex } from '@polkadot/util'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { generateMnemonic } from '@polkadot/util-crypto/mnemonic/bip39'

import { verifySubstrate } from './verify'

/**
 * DOTAccount implements the Account class for the substrate protocol.
 *  It is used to represent a substrate account when publishing a message on the Aleph network.
 */
export class DOTAccount extends Account {
  private pair?: KeyringPair
  private injector?: InjectedExtension

  constructor(pair: KeyringPair | InjectedExtension, address: string) {
    super(address)

    if ('address' in pair) {
      this.pair = pair
    } else {
      this.injector = pair
    }
  }

  getChain(): Blockchain {
    return Blockchain.DOT
  }

  /**
   * The Sign method provides a way to sign a given Aleph message using a substrate account.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * The sign method of the package 'polkadot' is used as the signature method.
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  async sign(message: SignableMessage): Promise<string> {
    const buffer = message.getVerificationBuffer()
    let signed = ''

    if (this.pair) {
      signed = `0x${Buffer.from(this.pair.sign(buffer)).toString('hex')}`
    } else {
      const signRaw = this.injector?.signer?.signRaw
      if (signRaw) {
        const { signature } = await signRaw({
          address: this.address,
          data: stringToHex(buffer.toString()),
          type: 'bytes',
        })
        signed = signature
      }
    }

    const signature = JSON.stringify({
      curve: 'sr25519',
      data: signed,
    })
    if (verifySubstrate(message, signature, this.address)) return signature

    throw new Error('Cannot proof the integrity of the signature')
  }
}

/**
 * Creates a new substrate account using a randomly generated substrate keyring.
 */
export async function newAccount(): Promise<{ account: DOTAccount; mnemonic: string }> {
  const mnemonic = generateMnemonic(24)

  return { account: await importAccountFromMnemonic(mnemonic), mnemonic: mnemonic }
}

/**
 * Imports a substrate account given a mnemonic and the 'polkadot' package.
 *
 * It creates an substrate wallet containing information about the account, extracted in the DOTAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 */
export async function importAccountFromMnemonic(mnemonic: string): Promise<DOTAccount> {
  const keyRing = new Keyring({ type: 'sr25519' })

  await cryptoWaitReady()
  const keyRingPair = keyRing.createFromUri(mnemonic, { name: 'sr25519' })
  return new DOTAccount(keyRingPair, keyRingPair.address)
}

/**
 * Imports a substrate account given a private key and the 'polkadot/keyring' package's class.
 *
 * It creates a substrate wallet containing information about the account, extracted in the DOTAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export async function importAccountFromPrivateKey(privateKey: string): Promise<DOTAccount> {
  const keyRing = new Keyring({ type: 'sr25519' })

  await cryptoWaitReady()
  const keyRingPair = keyRing.createFromUri(privateKey, { name: 'sr25519' })
  return new DOTAccount(keyRingPair, keyRingPair.address)
}

/**
 * Get an account from polkadot.js provider
 * This function can only be called inside a browser.
 * @param  {string} address that can refer an account to connect, by default connect account number 0
 */
export async function getAccountFromProvider(address?: string): Promise<DOTAccount> {
  let web3Bundle: typeof import('@polkadot/extension-dapp')

  try {
    web3Bundle = await import('@polkadot/extension-dapp')
  } catch (e: any) {
    throw new Error('Substrate provider can only be instanced in the browser.')
  }

  const extensions = await web3Bundle.web3Enable('Aleph Ts-Sdk')
  let injector: InjectedExtension

  if (extensions.length === 0) {
    throw new Error('Error: No provider installed')
  }

  const allAccounts = await web3Bundle.web3Accounts()
  if (address) injector = await web3Bundle.web3FromAddress(address)
  else injector = await web3Bundle.web3FromAddress(allAccounts[0].address)
  return new DOTAccount(injector, (await injector.accounts.get())[0].address)
}
