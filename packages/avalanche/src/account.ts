import { SignableMessage } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'
import { ChainData, ChainMetadata, ChangeRpcParam, EVMAccount, hexToDec, JsonRPCWallet, RpcId } from '@aleph-sdk/evm'
import { Buffer } from 'buffer'
import { BaseWallet, BrowserProvider, Eip1193Provider, HDNodeWallet, JsonRpcProvider, Wallet } from 'ethers'

import { EVMKeyPair, KeyChain, KeyPair, cb58Encode } from './keypair'
import { digestMessage, verifyAvalanche } from './verify'

/**
 * AvalancheAccount implements the Account class for the Avalanche protocol.
 * It is used to represent an Avalanche account when publishing a message on the Aleph network.
 */
export class AvalancheAccount extends EVMAccount {
  public readonly keyPair?: KeyPair | EVMKeyPair

  constructor(
    signerOrWallet: KeyPair | EVMKeyPair | BaseWallet | JsonRpcProvider | JsonRPCWallet,
    address: string,
    publicKey?: string,
    rpcId?: number,
  ) {
    super(address, publicKey)
    this.selectedRpcId = rpcId || RpcId.AVAX
    if (signerOrWallet instanceof KeyPair || signerOrWallet instanceof EVMKeyPair) {
      this.keyPair = signerOrWallet
      signerOrWallet = new Wallet(signerOrWallet.getPrivateKey().toString('hex'))
    }
    if (signerOrWallet instanceof JsonRpcProvider) this.wallet = new JsonRPCWallet(signerOrWallet)
    else if (signerOrWallet instanceof BaseWallet && !signerOrWallet.provider) {
      const network = ChainMetadata[rpcId || this.selectedRpcId]
      const provider = new JsonRpcProvider(network.rpcUrls.at(0), {
        name: network.chainName,
        chainId: hexToDec(network.chainId),
      })
      this.wallet = new JsonRPCWallet(signerOrWallet.connect(provider), undefined, network.rpcUrls.at(0))
    } else if (signerOrWallet instanceof JsonRPCWallet) {
      this.wallet = signerOrWallet
    }
  }

  override getChain(): Blockchain {
    if (this.keyPair || this.wallet) return Blockchain.AVAX

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

    if (this.wallet instanceof BaseWallet) {
      this.publicKey = this.wallet.signingKey.publicKey
      return
    }
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
      const signatureBuffer = this.keyPair.sign(digest)
      if (!signatureBuffer) throw new Error('Cannot sign message')

      const signature = cb58Encode(signatureBuffer)
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

const DEFAULT_HRP = 'avax'

/**
 * Get Key Chains
 * @param chain Avalanche chain type: c-chain | x-chain
 * @param hrp Avalanche human-readable part: avax | fuji | cascade
 * @returns key chains
 */
async function getKeyChain(chain = ChainType.C_CHAIN, hrp = DEFAULT_HRP) {
  return new KeyChain(hrp, chain)
}

export async function getKeyPair(privateKey?: string, chain = ChainType.C_CHAIN, hrp = DEFAULT_HRP): Promise<KeyPair> {
  const keyChain = await getKeyChain(chain, hrp)
  const keyPair = keyChain.makeKey()

  if (privateKey) {
    if (privateKey.startsWith('PrivateKey-')) return keyChain.importKey(privateKey)
    if (keyPair.importKey(Buffer.from(privateKey, 'hex'))) return keyPair
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
 * @param hrp Avalanche human-readable part: avax | fuji | cascade
 */
export async function importAccountFromPrivateKey(
  privateKey: string,
  chain = ChainType.C_CHAIN,
  hrp?: string,
): Promise<AvalancheAccount> {
  if (chain === ChainType.X_CHAIN) {
    const keyPair = await getKeyPair(privateKey, chain, hrp)
    return new AvalancheAccount(keyPair, keyPair.getAddressString(), keyPair.getPublicKey().toString('hex'))
  } else {
    const wallet = new Wallet(privateKey)
    return new AvalancheAccount(wallet, wallet.address, wallet.signingKey.publicKey)
  }
}

/**
 * Imports an Avalanche account given a mnemonic and the 'ethers' package.
 *
 * It creates an avalanche wallet containing information about the account, extracted in the AvalancheAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 * @param derivationPath The derivation path used to retrieve the list of accounts attached to the given mnemonic.
 * @param chain The Avalanche subnet to use the account with.
 * @param hrp Avalanche human-readable part: avax | fuji | cascade
 */
export async function importAccountFromMnemonic(
  mnemonic: string,
  derivationPath = "m/44'/60'/0'/0/0",
  chain = ChainType.C_CHAIN,
  hrp?: string,
): Promise<AvalancheAccount> {
  const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath)

  return await importAccountFromPrivateKey(wallet.privateKey, chain, hrp)
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {Eip1193Provider | BrowserProvider} provider
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function getAccountFromProvider(
  provider: Eip1193Provider | BrowserProvider,
  requestedRpc: ChangeRpcParam = RpcId.AVAX,
): Promise<AvalancheAccount> {
  const ETHprovider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider)
  const jrw = new JsonRPCWallet(ETHprovider, provider instanceof BrowserProvider ? undefined : provider)

  const chainId = hexToDec((typeof requestedRpc === 'number' ? ChainData[requestedRpc] : requestedRpc).chainId)
  if (chainId !== (await jrw.getCurrentChainId())) await jrw.changeNetwork(requestedRpc)
  await jrw.connect()

  if (jrw.address) {
    return new AvalancheAccount(
      jrw,
      jrw.address,
      undefined,
      typeof requestedRpc === 'number' ? requestedRpc : undefined,
    )
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
export function getEVMAddress(keypair: EVMKeyPair | KeyPair): string {
  const pkHex = keypair.getPrivateKey().toString('hex')
  return new Wallet(pkHex).address
}

/**
 * Creates a new Avalanche account using a randomly generated privateKey
 * @param chain Avalanche chain type: c-chain | x-chain
 * @param hrp Avalanche human-readable part: avax | fuji | cascade
 */
export async function newAccount(
  chain = ChainType.C_CHAIN,
  hrp?: string,
): Promise<{ account: AvalancheAccount; privateKey: string }> {
  const keypair = await getKeyPair(undefined, chain, hrp)
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
