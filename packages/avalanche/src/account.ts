import { BinTools, Buffer as AvaBuff } from 'avalanche'
import { KeyPair } from 'avalanche/dist/apis/avm'
import { KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm'
import { ethers, providers } from 'ethers'

import { Blockchain } from '@aleph-sdk/core'
import { BaseProviderWallet, SignableMessage } from '@aleph-sdk/account'
import { ChangeRpcParam, EVMAccount, JsonRPCWallet, RpcId } from '@aleph-sdk/evm'
import { verifyAvalanche } from './verify'
import { ChainType, digestMessage, getEVMAddress, getKeyPair } from './utils'

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

  override getChain(): Blockchain {
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
   * The Sign method provides a way to sign a given Aleph message using an avalanche keypair.
   * The full message is not used as the payload, only fields of the BaseMessage type are.
   *
   * The sign method of the keypair is used as the signature method.
   *
   * @param message The Aleph message to sign, using some of its fields.
   */
  async sign(message: SignableMessage): Promise<string> {
    const buffer = message.getVerificationBuffer()

    const digest = digestMessage(buffer)

    if (this.keyPair) {
      const digestHex = digest.toString('hex')
      const digestBuff = AvaBuff.from(digestHex, 'hex')
      const signatureBuffer = this.keyPair?.sign(digestBuff)
      if (!signatureBuffer) throw new Error('Cannot sign message')

      const bintools = BinTools.getInstance()
      const signature = bintools.cb58Encode(signatureBuffer)
      if (await verifyAvalanche(buffer, signature, '0x'.concat(this.keyPair.getPublicKey().toString('hex'))))
        return signature

      throw new Error('Cannot proof the integrity of the signature')
    } else if (this.wallet) {
      return await this.wallet.signMessage(buffer)
    }

    throw new Error('Cannot sign message')
  }
}

/**
 * Imports an Avalanche account given a private key and chain
 *
 * It creates an Avalanche keypair containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 * @param chain The Avalanche subnet to use the account with.
 */
export async function importAccountFromPrivateKey(
  privateKey: string,
  chain = ChainType.X_CHAIN,
): Promise<AvalancheAccount> {
  const keyPair = await getKeyPair(privateKey, chain)
  return new AvalancheAccount(keyPair, keyPair.getAddressString(), keyPair.getPublicKey().toString('hex'))
}

/**
 * Imports an ethereum account given a mnemonic and the 'ethers' package.
 *
 * It creates an avalanche wallet containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 * @param derivationPath The derivation path used to retrieve the list of accounts attached to the given mnemonic.
 * @param chain The Avalanche subnet to use the account with.
 */
export async function importAccountFromMnemonic(
  mnemonic: string,
  derivationPath = "m/44'/60'/0'/0/0",
  chain = ChainType.X_CHAIN,
): Promise<AvalancheAccount> {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, derivationPath)

  return await importAccountFromPrivateKey(wallet.privateKey, chain)
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {providers.ExternalProvider} provider from metamask
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function getAccountFromProvider(
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
 * Creates a new Avalanche account using a randomly generated privateKey
 */
export async function newAccount(
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
