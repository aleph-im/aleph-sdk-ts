import * as bip39 from 'bip39'
import { ethers } from 'ethers'
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from 'eciesjs'

import { Blockchain } from '@aleph-sdk/core'
import { SignableMessage, ECIESAccount, BaseProviderWallet } from '@aleph-sdk/account'
import {
  ProviderEncryptionLabel,
  ProviderEncryptionLib,
  ChangeRpcParam,
  JsonRPCWallet,
  RpcChainType,
} from '@aleph-sdk/evm'

/**
 * ETHAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
export class ETHAccount extends ECIESAccount {
  private wallet?: ethers.Wallet
  private provider?: BaseProviderWallet

  constructor(walletOrProvider: ethers.Wallet | BaseProviderWallet, address: string, publicKey?: string) {
    super(address, publicKey)

    if (walletOrProvider instanceof ethers.Wallet) this.wallet = walletOrProvider
    else this.provider = walletOrProvider
  }

  override GetChain(): Blockchain {
    return Blockchain.ETH
  }

  /**
   * Ask for a Provider Account a read Access to its encryption publicKey
   * If the encryption public Key is already loaded, nothing happens
   *
   * This method will throw if:
   * - The account was not instanced with a provider.
   * - The user denied the encryption public key sharing.
   */
  override async askPubKey(): Promise<void> {
    if (this.publicKey) return
    if (!this.provider) throw Error('PublicKey Error: No providers are setup')

    this.publicKey = await this.provider.getPublicKey()
    return
  }

  /**
   * Encrypt a content using the user's public key for an Ethereum account.
   *
   * @param content The content to encrypt.
   * @param delegateSupport Optional, if you want to encrypt data for another EthAccount (Can also be directly a public key)
   * @param encryptionMethod Optional, chose the standard encryption method to use (With provider).
   */
  async encrypt(
    content: Buffer,
    delegateSupport?: ECIESAccount | string,
    encryptionMethod: ProviderEncryptionLabel = ProviderEncryptionLabel.METAMASK,
  ): Promise<Buffer | string> {
    let publicKey: string | undefined

    // Does the content is encrypted for a tier?
    if (delegateSupport instanceof ECIESAccount) {
      if (!delegateSupport.publicKey) {
        await delegateSupport.askPubKey()
      }
      publicKey = delegateSupport.publicKey
    } else if (delegateSupport) {
      publicKey = delegateSupport
    } else {
      await this.askPubKey()
      publicKey = this.publicKey
    }

    if (!publicKey) throw new Error('Cannot encrypt content')
    if (!this.provider) {
      // Wallet encryption method or non-metamask provider
      return secp256k1_encrypt(publicKey, content)
    } else {
      // provider encryption
      return ProviderEncryptionLib[encryptionMethod](content, publicKey)
    }
  }

  /**
   * Decrypt a given content using an ETHAccount.
   *
   * @param encryptedContent The encrypted content to decrypt.
   */
  async decrypt(encryptedContent: Buffer | string): Promise<Buffer> {
    if (this.wallet) {
      const secret = this.wallet.privateKey
      return secp256k1_decrypt(secret, Buffer.from(encryptedContent))
    }
    if (this.provider) {
      const decrypted = await this.provider.decrypt(encryptedContent)
      return Buffer.from(decrypted)
    }
    throw new Error('Cannot encrypt content')
  }

  /**
   * The Sign method provides a way to sign a given Aleph message using an ethereum account.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * The signMessage method of the package 'ethers' is used as the signature method.
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  async Sign(message: SignableMessage): Promise<string> {
    if (message.GetVerificationBuffer === undefined)
      throw new Error("message doesn't have a valid GetVerificationBuffer method")

    const buffer = message.GetVerificationBuffer()

    const signMethod = this.wallet || this.provider

    if (signMethod) return signMethod.signMessage(buffer.toString())

    throw new Error('Cannot sign message')
  }
}

/**
 * Imports an ethereum account given a mnemonic and the 'ethers' package.
 *
 * It creates an ethereum wallet containing information about the account, extracted in the ETHAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 * @param derivationPath The derivation path used to retrieve the list of accounts attached to the given mnemonic.
 */
export function ImportAccountFromMnemonic(mnemonic: string, derivationPath = "m/44'/60'/0'/0/0"): ETHAccount {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, derivationPath)

  return new ETHAccount(wallet, wallet.address, wallet.publicKey)
}

/**
 * Imports an ethereum account given a private key and the 'ethers' package.
 *
 * It creates an ethereum wallet containing information about the account, extracted in the ETHAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function ImportAccountFromPrivateKey(privateKey: string): ETHAccount {
  const wallet = new ethers.Wallet(privateKey)

  return new ETHAccount(wallet, wallet.address, wallet.publicKey)
}

/**
 * Creates a new ethereum account using a generated mnemonic following BIP 39 standard.
 *
 * @param derivationPath
 */
export function NewAccount(derivationPath = "m/44'/60'/0'/0/0"): { account: ETHAccount; mnemonic: string } {
  const mnemonic = bip39.generateMnemonic()

  return { account: ImportAccountFromMnemonic(mnemonic, derivationPath), mnemonic: mnemonic }
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {ethers.providers.ExternalProvider} provider
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function GetAccountFromProvider(
  provider: ethers.providers.ExternalProvider,
  requestedRpc: ChangeRpcParam = RpcChainType.ETH,
): Promise<ETHAccount> {
  const ETHprovider = new ethers.providers.Web3Provider(provider)
  const jrw = new JsonRPCWallet(ETHprovider)
  await jrw.changeNetwork(requestedRpc)
  await jrw.connect()

  if (jrw.address) return new ETHAccount(jrw, jrw.address)
  throw new Error('Insufficient permissions')
}
