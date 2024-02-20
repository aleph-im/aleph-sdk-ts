import * as bip39 from 'bip39'
import { ethers } from 'ethers'

import { Blockchain } from '@aleph-sdk/core'
import { SignableMessage, ECIESAccount, BaseProviderWallet } from '@aleph-sdk/account'
import {
  ChangeRpcParam,
  JsonRPCWallet,
  RpcId,
  EVMAccount,
} from '@aleph-sdk/evm'

/**
 * ETHAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
export class ETHAccount extends EVMAccount {
  public override readonly wallet: ethers.Wallet | BaseProviderWallet

  public constructor(wallet: ethers.Wallet | BaseProviderWallet, address: string, publicKey?: string) {
    super(address, publicKey)
    this.wallet = wallet
  }

  override getChain(): Blockchain {
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
    if (!this.wallet) throw Error('PublicKey Error: No providers are setup')

    if (this.wallet instanceof ethers.Wallet) {
      this.publicKey = this.wallet.publicKey
      return
    }
    this.publicKey = await this.wallet.getPublicKey()
    return
  }

  /**
   * The Sign method provides a way to sign a given Aleph message using an ethereum account.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * The signMessage method of the package 'ethers' is used as the signature method.
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  async sign(message: SignableMessage): Promise<string> {
    const buffer = message.getVerificationBuffer()
    return this.wallet.signMessage(buffer.toString())
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
  requestedRpc: ChangeRpcParam = RpcId.ETH,
): Promise<ETHAccount> {
  const ETHprovider = new ethers.providers.Web3Provider(provider)
  const jrw = new JsonRPCWallet(ETHprovider)
  await jrw.changeNetwork(requestedRpc)
  await jrw.connect()

  if (jrw.address) return new ETHAccount(jrw, jrw.address)
  throw new Error('Insufficient permissions')
}
