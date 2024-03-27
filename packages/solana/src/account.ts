import { Keypair, PublicKey } from '@solana/web3.js'
import base58 from 'bs58'
import nacl from 'tweetnacl'

import { Blockchain } from '@aleph-sdk/core'
import { Account, SignableMessage } from '@aleph-sdk/account'
import { verifySolana } from './verify'

type WalletSignature = {
  signature: Uint8Array
  publicKey: string
}
interface MessageSigner {
  signMessage(message: Uint8Array): Promise<WalletSignature> | Promise<Uint8Array>
  publicKey: PublicKey
  connected: boolean
  connect(): Promise<void>
}

/**
 * SOLAccount implements the Account class for the Solana protocol.
 * It is used to represent a solana account when publishing a message on the Aleph network.
 */
export class SOLAccount extends Account {
  private readonly wallet?: MessageSigner
  private readonly keypair?: Keypair
  public isKeypair: boolean

  constructor(publicKey: PublicKey, walletOrKeypair: Keypair | MessageSigner) {
    super(publicKey.toString())
    if (walletOrKeypair instanceof Keypair) {
      this.keypair = walletOrKeypair
      this.isKeypair = true
    } else {
      this.wallet = walletOrKeypair
      this.isKeypair = false
    }
  }

  override getChain(): Blockchain {
    return Blockchain.SOL
  }

  /**
   * The Sign method provides a way to sign a given Aleph message using an solana account.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * nacl is used to sign the payload with the account's private key.
   * The final message's signature is composed of the signed payload and the user's public key.
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  override async sign(message: SignableMessage): Promise<string> {
    const buffer = message.getVerificationBuffer()

    let signature

    if (this.wallet) {
      const signed = await this.wallet.signMessage(buffer)
      if (signed instanceof Uint8Array) signature = signed
      else signature = signed.signature
    } else if (this.keypair) {
      signature = base58.encode(nacl.sign.detached(buffer, this.keypair.secretKey))
    } else {
      throw new Error('Cannot sign message')
    }

    if (verifySolana(buffer, JSON.stringify({ signature, publicKey: this.address }))) {
      return JSON.stringify({
        signature,
        publicKey: this.address,
      })
    }
    throw new Error('Cannot proof the integrity of the signature')
  }
}

/**
 * Imports a solana account given a private key and the Keypair solana/web3.js package's class.
 *
 * It creates a solana wallet containing information about the account, extracted in the SOLAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function importAccountFromPrivateKey(privateKey: Uint8Array): SOLAccount {
  const keypair = Keypair.fromSecretKey(privateKey)

  return new SOLAccount(keypair.publicKey, keypair)
}

/**
 * Creates a new solana account using a randomly generated solana keypair.
 */
export function newAccount(): { account: SOLAccount; privateKey: Uint8Array } {
  const account = new Keypair()

  return { account: importAccountFromPrivateKey(account.secretKey), privateKey: account.secretKey }
}

/**
 * Retrieves a solana account using an in-browser wallet provider
 */
export async function getAccountFromProvider(provider: MessageSigner): Promise<SOLAccount> {
  if (!provider.connected) await provider.connect()
  if (!provider.publicKey) throw new Error('This wallet does not provide a public key')

  return new SOLAccount(provider.publicKey, provider)
}
