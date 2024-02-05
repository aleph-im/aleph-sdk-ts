import {
  makeSignDoc,
  OfflineAminoSigner,
  Secp256k1HdWallet,
  Secp256k1HdWalletOptions,
  Secp256k1Wallet,
} from '@cosmjs/amino'
import { Blockchain } from '@aleph-sdk/core'
import { Account, SignableMessage } from '@aleph-sdk/account'

/**
 * CosmosAccount implements the Account class for the Cosmos protocol.
 * It is used to represent a Cosmos account when publishing a message on the Aleph network.
 */
export class CosmosAccount extends Account {
  private wallet: OfflineAminoSigner
  private accountNumber: number

  constructor(wallet: OfflineAminoSigner, address: string, accountNumber = 0) {
    super(address)
    this.wallet = wallet
    this.accountNumber = accountNumber
  }

  GetChain(): Blockchain {
    return Blockchain.CSDK
  }

  /**
   * The Sign method provides a way to sign a given Aleph message using a Cosmos account.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * The signMessage method uses the amino SignDoc helpers to generate the signature
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  async Sign(message: SignableMessage): Promise<string> {
    if (message.GetVerificationBuffer === undefined)
      throw new Error("message doesn't have a valid GetVerificationBuffer method")

    const buffer = message.GetVerificationBuffer()

    const aminoMsg = {
      type: 'signutil/MsgSignText',
      value: {
        message: buffer.toString(),
        signer: message.sender,
      },
    }

    const signDoc = makeSignDoc([aminoMsg], { amount: [], gas: '0' }, 'signed-message-v1', '', this.accountNumber, '0')
    const { signature } = await this.wallet.signAmino(this.address, signDoc)

    return JSON.stringify(signature)
  }
}

async function getCosmosAccount(wallet: OfflineAminoSigner, accountNumber = 0): Promise<CosmosAccount> {
  const accounts = await wallet.getAccounts()
  try {
    const account = accounts[accountNumber]
    return new CosmosAccount(wallet, account.address, accountNumber)
  } catch (err) {
    throw new RangeError('Account offset out of bound')
  }
}

/**
 * Creates a new random Cosmos Account from a randomly generated mnemonic
 *
 * @param  {12|15|18|21|24} length? The length of the mnemonic
 * @param  {Partial<Secp256k1HdWalletOptions>} options?
 */
export async function NewAccount(
  length?: 12 | 15 | 18 | 21 | 24,
  options?: Partial<Secp256k1HdWalletOptions>,
): Promise<{ account: CosmosAccount; mnemonic: string }> {
  const wallet = await Secp256k1HdWallet.generate(length, options)

  return {
    account: await getCosmosAccount(wallet),
    mnemonic: wallet.mnemonic,
  }
}

/**
 * Imports a Cosmos Account using a mnemonic
 *
 * @param  {string} mnemonic
 * @param  {Partial<Secp256k1HdWalletOptions>} options?
 */
export async function ImportAccountFromMnemonic(
  mnemonic: string,
  options?: Partial<Secp256k1HdWalletOptions>,
): Promise<CosmosAccount> {
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, options)

  return getCosmosAccount(wallet)
}

/**
 * Import a Cosmos Account using a private Key
 *
 * @param  {string} privateKey
 * @param  {string} prefix?
 */
export async function ImportAccountFromPrivateKey(privateKey: string, prefix?: string): Promise<CosmosAccount> {
  const key = Buffer.from(privateKey)
  const wallet = await Secp256k1Wallet.fromKey(key, prefix)

  return getCosmosAccount(wallet)
}
