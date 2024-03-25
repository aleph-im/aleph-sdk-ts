import { Blockchain } from '@aleph-sdk/core'
import { SignableMessage } from './types'

/**
 * The Account class is used to implement protocols related accounts - Ethereum, Solana, ...
 * It contains the account's address and public key.
 *
 * All inherited classes of account must implement the GetChain and Sign methods.
 */
export abstract class Account {
  readonly address: string

  protected constructor(address: string) {
    this.address = address
  }

  abstract getChain(): Blockchain
  abstract sign(message: SignableMessage): Promise<string>
}

/**
 * The ECIESAccount class is used to implement protocols using secp256k1's curve.
 * It extends the Account class by exposing an encryption publicKey.
 *
 * Encryption has been removed as of the v1.0.0 release but will find its way back into the SDK.
 */
export abstract class ECIESAccount extends Account {
  public publicKey: string | undefined

  protected constructor(address: string, publicKey?: string) {
    super(address)
    this.publicKey = publicKey
  }

  abstract askPubKey(): Promise<void>
}
