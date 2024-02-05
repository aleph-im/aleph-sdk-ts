import { RequestSignPayloadInput, SigningType } from '@airgap/beacon-types'
import { InMemorySigner } from '@taquito/signer'
import { b58cdecode, b58cencode, prefix, getPkhfromPk, char2Bytes } from '@taquito/utils'
import { BeaconWallet } from '@taquito/beacon-wallet'
import nacl from 'tweetnacl'

import { Blockchain } from '@aleph-sdk/core'
import { Account, SignableMessage } from '@aleph-sdk/account'

// The data to format
export const STANDARD_DAPP_URL = 'https://aleph.im'

/**
 * XTZAccount implements the Account class for the Tezos protocol.
 * It is used to represent a Tezos account when publishing a message on the Aleph network.
 */
export class TEZOSAccount extends Account {
  private readonly wallet: BeaconWallet | InMemorySigner
  public dAppUrl: string

  /**
   * @param publicKey The public key encoded in base58. Needed due to asynchronous getter of the public key.
   * @param wallet The signer containing the private key used to sign the message.
   * @param dAppUrl The URL of the dApp that is publishing the message. Defaults to "aleph.im". Used by wallets to
   * display the requester of the signature.
   */
  constructor(publicKey: string, wallet: BeaconWallet | InMemorySigner, dAppUrl?: string) {
    super(getPkhfromPk(publicKey))
    this.wallet = wallet
    this.dAppUrl = dAppUrl || STANDARD_DAPP_URL
  }

  override GetChain(): Blockchain {
    return Blockchain.TEZOS
  }

  async GetPublicKey(): Promise<string> {
    if (this.wallet instanceof BeaconWallet) {
      return await getPublicKeyFromWallet(this.wallet)
    } else {
      return this.wallet.publicKey()
    }
  }

  /**
   * The Sign method provides a way to sign a given Aleph message using a Tezos account.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * nacl is used to sign the payload with the account's private key.
   * The final message's signature is composed of the signed payload and the user's public key.
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  override async Sign(message: SignableMessage): Promise<string> {
    if (message.GetVerificationBuffer === undefined)
      throw new Error("message doesn't have a valid GetVerificationBuffer method")

    const buffer = message.GetVerificationBuffer()

    const ISO8601formattedTimestamp = new Date(message.time).toISOString()
    // The full string
    const formattedInput: string = [
      'Tezos Signed Message:',
      this.dAppUrl,
      ISO8601formattedTimestamp,
      buffer.toString(),
    ].join(' ')
    // The bytes to sign
    const bytes = char2Bytes(formattedInput)
    const payloadBytes = '05' + '0100' + char2Bytes(String(bytes.length)) + bytes
    // The payload to send to the wallet
    const payload: RequestSignPayloadInput = {
      signingType: SigningType.MICHELINE,
      payload: payloadBytes,
      sourceAddress: await this.GetPublicKey(),
    }
    // The signature
    let signature: string
    if (this.wallet instanceof BeaconWallet) {
      signature = (await this.wallet.client.requestSignPayload(payload)).signature
    } else {
      signature = (await this.wallet.sign(payloadBytes)).sig
    }
    return JSON.stringify({
      signature: signature,
      publicKey: await this.GetPublicKey(),
      signingType: SigningType.MICHELINE.toLowerCase(),
      dAppUrl: this.dAppUrl,
    })
  }
}

/**
 * Imports a Tezos account given a beacon wallet integration, using the @taquito/beacon-wallet BeaconWallet class.
 *
 * @param wallet
 */
export async function ImportAccountFromBeaconWallet(wallet: BeaconWallet): Promise<TEZOSAccount> {
  return new TEZOSAccount(await getPublicKeyFromWallet(wallet), wallet)
}

/**
 * Imports a Tezos account given a private key, using the @taquito/signer InMemorySigner class.
 *
 * @param privateKey The private key of the account to import.
 * @param passphrase The password, if the key is encrypted.
 */
export async function ImportAccountFromPrivateKey(privateKey: string, passphrase?: string): Promise<TEZOSAccount> {
  const wallet: InMemorySigner = new InMemorySigner(privateKey, passphrase)

  return new TEZOSAccount(await wallet.publicKey(), wallet)
}

/**
 * Imports a Tezos account given fundraiser information, using the @taquito/signer InMemorySigner class.
 *
 * @param email The email used.
 * @param password The password used.
 * @param mnemonic The mnemonic received during the fundraiser.
 */
export async function ImportAccountFromFundraiserInfo(
  email: string,
  password: string,
  mnemonic: string,
): Promise<TEZOSAccount> {
  const wallet: InMemorySigner = await InMemorySigner.fromFundraiser(email, password, mnemonic)

  return new TEZOSAccount(await wallet.publicKeyHash(), wallet)
}

/**
 * Creates a new Tezos account (tz1) using a randomly generated Tezos keypair.
 */
export async function NewAccount(): Promise<{ signerAccount: TEZOSAccount; privateKey: Uint8Array }> {
  const key = b58cencode(nacl.sign.keyPair().secretKey, prefix.edsk)
  const wallet = await ImportAccountFromPrivateKey(key)

  return {
    signerAccount: wallet,
    privateKey: b58cdecode(key, prefix.edsk),
  }
}

async function getPublicKeyFromWallet(wallet: BeaconWallet): Promise<string> {
  const publicKey = (await wallet.client.getActiveAccount())?.publicKey
  if (publicKey === undefined) {
    throw new Error('No active account on the tezos wallet')
  }
  return publicKey
}
