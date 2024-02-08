import { Avalanche, BinTools, Buffer as AvaBuff } from 'avalanche'
import { KeyPair, KeyChain } from 'avalanche/dist/apis/avm'
import { KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm'
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from 'eciesjs'
import { ethers, providers } from 'ethers'
import { privateToAddress } from 'ethereumjs-util'

import { Blockchain } from '@aleph-sdk/core'
import { SignableMessage, ECIESAccount, BaseProviderWallet } from '@aleph-sdk/account'
import {
  ProviderEncryptionLabel,
  ProviderEncryptionLib,
  ChangeRpcParam,
  RpcId,
  EVMAccount,
  JsonRPCWallet,
} from '@aleph-sdk/evm'
import { digestMessage, verifyAvalanche } from './verify'

/**
 * AvalancheAccount implements the Account class for the Avalanche protocol.
 * It is used to represent an Avalanche account when publishing a message on the Aleph network.
 */
export class AvalancheAccount extends EVMAccount {
  public declare readonly wallet?: BaseProviderWallet
  public readonly keyPair?: KeyPair | EVMKeyPair

  constructor(
    signerOrWallet: KeyPair | EVMKeyPair | BaseProviderWallet | ethers.providers.JsonRpcProvider,
    address: string,
    publicKey?: string,
  ) {
    super(address, publicKey)
    if (signerOrWallet instanceof ethers.providers.JsonRpcProvider) this.wallet = new JsonRPCWallet(signerOrWallet)
    else if (signerOrWallet instanceof KeyPair || signerOrWallet instanceof EVMKeyPair) this.keyPair = signerOrWallet
    else this.wallet = signerOrWallet
  }

  override GetChain(): Blockchain {
    if (this.keyPair) return Blockchain.AVAX
    if (this.wallet) return Blockchain.ETH

    throw new Error('Cannot determine chain')
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
    this.publicKey = await this.wallet.getPublicKey()
    return
  }

  /**
   * Encrypt a content using the user's public key from the keypair
   *
   * @param content The content to encrypt.
   * @param delegateSupport Optional, if you want to encrypt data for another ECIESAccount (Can also be directly a public key)
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
    if (!this.wallet) {
      // Wallet encryption method or non-metamask provider
      return secp256k1_encrypt(publicKey, content)
    } else {
      // provider encryption
      return ProviderEncryptionLib[encryptionMethod](content, publicKey)
    }
  }

  /**
   * Decrypt a given content using the private key from the keypair.
   *
   * @param encryptedContent The encrypted content to decrypt.
   */
  async decrypt(encryptedContent: Buffer | string): Promise<Buffer> {
    if (this.keyPair) {
      const secret = this.keyPair.getPrivateKey().toString('hex')
      return secp256k1_decrypt(secret, Buffer.from(encryptedContent))
    }
    if (this.wallet) {
      const decrypted = await this.wallet.decrypt(encryptedContent)
      return Buffer.from(decrypted)
    }
    throw new Error('Cannot encrypt content')
  }

  /**
   * The Sign method provides a way to sign a given Aleph message using an avalanche keypair.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * The sign method of the keypair is used as the signature method.
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  async Sign(message: SignableMessage): Promise<string> {
    const buffer = message.GetVerificationBuffer()

    const digest = digestMessage(buffer)

    if (this.keyPair) {
      const digestHex = digest.toString('hex')
      const digestBuff = AvaBuff.from(digestHex, 'hex')
      const signatureBuffer = this.keyPair?.sign(digestBuff)

      const bintools = BinTools.getInstance()
      const signature = bintools.cb58Encode(signatureBuffer)
      if (await verifyAvalanche(buffer, signature, this.keyPair.getPublicKey().toString('hex'))) return signature

      throw new Error('Cannot proof the integrity of the signature')
    } else if (this.wallet) {
      return await this.wallet.signMessage(buffer)
    }

    throw new Error('Cannot sign message')
  }
}

export enum ChainType {
  C_CHAIN = 'C',
  X_CHAIN = 'X',
}

/**
 * Get Key Chains
 * @param chain Avalanche chain type: c-chain | x-chain
 * @returns key chains
 */
async function getKeyChain(chain = ChainType.X_CHAIN) {
  return new KeyChain(new Avalanche().getHRP(), chain)
}

export async function getKeyPair(privateKey?: string, chain = ChainType.X_CHAIN): Promise<KeyPair> {
  const keyChain = await getKeyChain(chain)
  const keyPair = keyChain.makeKey()

  if (privateKey) {
    let keyBuff: AvaBuff
    if (privateKey.startsWith('PrivateKey-')) {
      const bintools = BinTools.getInstance()
      keyBuff = bintools.cb58Decode(privateKey.split('-')[1])
    } else {
      keyBuff = AvaBuff.from(privateKey, 'hex')
    }
    if (keyPair.importKey(keyBuff)) return keyPair
    throw new Error('Invalid private key')
  }
  return keyPair
}

/**
 * Imports an Avalanche account given a private key and chain
 *
 * It creates an Avalanche keypair containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 * @param chain The Avalanche subnet to use the account with.
 */
export async function ImportAccountFromPrivateKey(
  privateKey: string,
  chain = ChainType.X_CHAIN,
): Promise<AvalancheAccount> {
  const keyPair = await getKeyPair(privateKey, chain)
  return new AvalancheAccount(keyPair, keyPair.getAddressString(), keyPair.getPublicKey().toString('hex'))
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {providers.ExternalProvider} provider from metamask
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function GetAccountFromProvider(
  provider: providers.ExternalProvider,
  requestedRpc: ChangeRpcParam = RpcId.AVAX,
): Promise<AvalancheAccount> {
  const avaxProvider = new providers.Web3Provider(provider)
  const jrw = new JsonRPCWallet(avaxProvider)
  await jrw.changeNetwork(requestedRpc)

  await jrw.connect()
  if (jrw.address) {
    return new AvalancheAccount(jrw, jrw.address)
  }
  throw new Error('Insufficient permissions')
}

/**
 * Retrieves the EVM compatible address for the current account.
 * This function works specifically with the C-Chain.
 *
 * If the current signer is not associated with the C-Chain,
 * the function throws an error.
 *
 * @returns A Promise that resolves to the EVM-style address of the account
 * @throws An error if the current signer is not associated with the C-Chain
 */
function getEVMAddress(keypair: EVMKeyPair): string {
  const pkHex = keypair.getPrivateKey().toString('hex')
  const pkBuffNative = Buffer.from(pkHex, 'hex')
  const ethAddress = privateToAddress(pkBuffNative).toString('hex')
  return `0x${ethAddress}`
}

/**
 * Creates a new Avalanche account using a randomly generated privateKey
 */
export async function NewAccount(
  chain = ChainType.X_CHAIN,
): Promise<{ account: AvalancheAccount; privateKey: string }> {
  const keypair = await getKeyPair(undefined, chain)
  const privateKey = keypair.getPrivateKey().toString('hex')

  let address: string = keypair.getAddressString()
  if (chain === ChainType.C_CHAIN) {
    address = getEVMAddress(keypair)
  }

  return {
    account: new AvalancheAccount(keypair, address, keypair.getPublicKey().toString('hex')),
    privateKey,
  }
}
