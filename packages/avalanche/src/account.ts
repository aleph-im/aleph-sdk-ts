import { Avalanche, BinTools, Buffer as AvaBuff } from 'avalanche'
import { KeyPair } from 'avalanche/dist/apis/avm'
import { decrypt as secp256k1_decrypt, encrypt as secp256k1_encrypt } from 'eciesjs'
import { providers } from 'ethers'
import shajs from 'sha.js'

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
 * AvalancheAccount implements the Account class for the Avalanche protocol.
 * It is used to represent an Avalanche account when publishing a message on the Aleph network.
 */
export class AvalancheAccount extends ECIESAccount {
  private signer?: KeyPair
  private provider?: BaseProviderWallet

  constructor(signerOrProvider: KeyPair | BaseProviderWallet, address: string, publicKey?: string) {
    super(address, publicKey)

    if (signerOrProvider instanceof KeyPair) this.signer = signerOrProvider
    if (signerOrProvider instanceof BaseProviderWallet) this.provider = signerOrProvider
  }

  override GetChain(): Blockchain {
    if (this.signer) return Blockchain.AVAX
    if (this.provider) return Blockchain.ETH

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
    if (!this.provider) throw Error('PublicKey Error: No providers are setup')

    this.publicKey = await this.provider.getPublicKey()
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
    if (!this.provider) {
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
    if (this.signer) {
      const secret = this.signer.getPrivateKey().toString('hex')
      return secp256k1_decrypt(secret, Buffer.from(encryptedContent))
    }
    if (this.provider) {
      const decrypted = await this.provider.decrypt(encryptedContent)
      return Buffer.from(decrypted)
    }
    throw new Error('Cannot encrypt content')
  }

  private async digestMessage(message: Buffer) {
    const msgSize = Buffer.alloc(4)
    msgSize.writeUInt32BE(message.length, 0)
    const msgStr = message.toString('utf-8')
    const msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, 'utf8')

    return new shajs.sha256().update(msgBuf).digest()
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
    if (message.GetVerificationBuffer === undefined)
      throw new Error("message doesn't have a valid GetVerificationBuffer method")

    const buffer = message.GetVerificationBuffer()

    const digest = await this.digestMessage(buffer)

    if (this.signer) {
      const digestHex = digest.toString('hex')
      const digestBuff = AvaBuff.from(digestHex, 'hex')
      const signatureBuffer = this.signer?.sign(digestBuff)

      const bintools = BinTools.getInstance()
      return bintools.cb58Encode(signatureBuffer)
    } else if (this.provider) {
      return await this.provider.signMessage(buffer)
    }

    throw new Error('Cannot sign message')
  }
}

async function getKeyChain() {
  const ava = new Avalanche()
  const xChain = ava.XChain()

  return xChain.keyChain()
}

export async function getKeyPair(privateKey?: string): Promise<KeyPair> {
  const keyChain = await getKeyChain()
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
 * Imports an Avalanche account given a private key.
 *
 * It creates an Avalanche keypair containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export async function ImportAccountFromPrivateKey(privateKey: string): Promise<AvalancheAccount> {
  const keyPair = await getKeyPair(privateKey)
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
  requestedRpc: ChangeRpcParam = RpcChainType.AVAX,
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
 * Creates a new Avalanche account using a randomly generated privateKey
 *
 */
export async function NewAccount(): Promise<{ account: AvalancheAccount; privateKey: string }> {
  const keypair = await getKeyPair()
  const privateKey = keypair.getPrivateKey().toString('hex')

  return {
    account: new AvalancheAccount(keypair, keypair.getAddressString(), keypair.getPublicKey().toString('hex')),
    privateKey,
  }
}
