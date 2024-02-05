import { Keyring } from '@polkadot/keyring'
import { KeyringPair } from '@polkadot/keyring/types'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { generateMnemonic } from '@polkadot/util-crypto/mnemonic/bip39'

import { Blockchain } from '@aleph-sdk/core'
import { Account, SignableMessage } from '@aleph-sdk/account'

/**
 * DOTAccount implements the Account class for the substrate protocol.
 *  It is used to represent a substrate account when publishing a message on the Aleph network.
 */
export class DOTAccount extends Account {
  private pair: KeyringPair
  constructor(pair: KeyringPair) {
    super(pair.address)
    this.pair = pair
  }

  GetChain(): Blockchain {
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
  Sign(message: SignableMessage): Promise<string> {
    if (message.GetVerificationBuffer === undefined)
      throw new Error("message doesn't have a valid GetVerificationBuffer method")

    const buffer = message.GetVerificationBuffer()

    return new Promise((resolve) => {
      const signed = `0x${Buffer.from(this.pair.sign(buffer)).toString('hex')}`

      resolve(
        JSON.stringify({
          curve: 'sr25519',
          data: signed,
        }),
      )
    })
  }

  /**
   * Encrypt a content using the user's public key for a Substrate account.
   *
   * @param content The content to encrypt.
   */
  encrypt(content: Buffer): Buffer {
    return Buffer.from(this.pair.encryptMessage(content, this.pair.address))
  }

  /**
   * Decrypt a given content using a NULS account.
   *
   * @param encryptedContent The encrypted content to decrypt.
   */
  decrypt(encryptedContent: Buffer): Buffer | null {
    const res = this.pair.decryptMessage(encryptedContent, this.pair.address)
    if (res) return Buffer.from(res)

    throw "Error: This message can't be decoded"
  }
}

/**
 * Creates a new substrate account using a randomly generated substrate keyring.
 */
export async function NewAccount(): Promise<{ account: DOTAccount; mnemonic: string }> {
  const mnemonic = generateMnemonic()

  return { account: await ImportAccountFromMnemonic(mnemonic), mnemonic: mnemonic }
}

/**
 * Imports a substrate account given a mnemonic and the 'polkadot' package.
 *
 * It creates an substrate wallet containing information about the account, extracted in the DOTAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 */
export async function ImportAccountFromMnemonic(mnemonic: string): Promise<DOTAccount> {
  const keyRing = new Keyring({ type: 'sr25519' })

  await cryptoWaitReady()
  return new DOTAccount(keyRing.createFromUri(mnemonic, { name: 'sr25519' }))
}

/**
 * Imports a substrate account given a private key and the 'polkadot/keyring' package's class.
 *
 * It creates a substrate wallet containing information about the account, extracted in the DOTAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export async function ImportAccountFromPrivateKey(privateKey: string): Promise<DOTAccount> {
  const keyRing = new Keyring({ type: 'sr25519' })

  await cryptoWaitReady()
  return new DOTAccount(keyRing.createFromUri(privateKey, { name: 'sr25519' }))
}
