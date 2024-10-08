import { SignableMessage } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'
import { ChainData, ChainMetadata, ChangeRpcParam, EVMAccount, hexToDec, JsonRPCWallet, RpcId } from '@aleph-sdk/evm'
import { Buffer as AvaBuff, AvalancheCore as Avalanche, BinTools } from 'avalanche'
import { KeyChain, KeyPair } from 'avalanche/dist/apis/avm'
import { KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm'
import { privateToAddress } from 'ethereumjs-util'
import { providers, utils, Wallet } from 'ethers'

import { digestMessage, verifyAvalanche } from './verify'

/**
 * AvalancheAccount implements the Account class for the Avalanche protocol.
 * It is used to represent an Avalanche account when publishing a message on the Aleph network.
 */
export class AvalancheAccount extends EVMAccount {
  public readonly keyPair?: KeyPair | EVMKeyPair

  constructor(
    signerOrWallet: KeyPair | EVMKeyPair | Wallet | providers.JsonRpcProvider | JsonRPCWallet,
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
    if (signerOrWallet instanceof providers.JsonRpcProvider) this.wallet = new JsonRPCWallet(signerOrWallet)
    else if (signerOrWallet instanceof Wallet && !signerOrWallet.provider) {
      const network = ChainMetadata[rpcId || this.selectedRpcId]
      const provider = new providers.JsonRpcProvider(network.rpcUrls.at(0), {
        name: network.chainName,
        chainId: hexToDec(network.chainId),
      })
      this.wallet = new JsonRPCWallet(signerOrWallet.connect(provider))
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

    if (this.wallet instanceof Wallet) {
      this.publicKey = this.wallet.publicKey
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
      const digestHex = digest.toString('hex')
      const digestBuff = AvaBuff.from(digestHex, 'hex')
      const signatureBuffer = this.keyPair?.sign(digestBuff)
      if (!signatureBuffer) throw new Error('Cannot sign message')

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
async function getKeyChain(chain = ChainType.C_CHAIN) {
  return new KeyChain(new Avalanche().getHRP(), chain)
}

export async function getKeyPair(privateKey?: string, chain = ChainType.C_CHAIN): Promise<KeyPair> {
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
export async function importAccountFromPrivateKey(
  privateKey: string,
  chain = ChainType.C_CHAIN,
): Promise<AvalancheAccount> {
  if (chain === ChainType.X_CHAIN) {
    const keyPair = await getKeyPair(privateKey, chain)
    return new AvalancheAccount(keyPair, keyPair.getAddressString(), keyPair.getPublicKey().toString('hex'))
  } else {
    const wallet = new Wallet(privateKey)
    return new AvalancheAccount(wallet, wallet.address, wallet.publicKey)
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
 */
export async function importAccountFromMnemonic(
  mnemonic: string,
  derivationPath = "m/44'/60'/0'/0/0",
  chain = ChainType.C_CHAIN,
): Promise<AvalancheAccount> {
  const wallet = Wallet.fromMnemonic(mnemonic, derivationPath)

  return await importAccountFromPrivateKey(wallet.privateKey, chain)
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {providers.ExternalProvider | providers.Web3Provider} provider
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function getAccountFromProvider(
  provider: providers.ExternalProvider | providers.Web3Provider,
  requestedRpc: ChangeRpcParam = RpcId.AVAX,
): Promise<AvalancheAccount> {
  const ETHprovider = provider instanceof providers.Web3Provider ? provider : new providers.Web3Provider(provider)
  const jrw = new JsonRPCWallet(ETHprovider)

  const chainId = Number((typeof requestedRpc === 'number' ? ChainData[requestedRpc] : requestedRpc).chainId)
  if (chainId !== (await jrw.provider.getNetwork()).chainId) await jrw.changeNetwork(requestedRpc)
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
export function getEVMAddress(keypair: EVMKeyPair): string {
  const pkHex = keypair.getPrivateKey().toString('hex')
  const pkBuffNative = Buffer.from(pkHex, 'hex')
  const ethAddress = privateToAddress(pkBuffNative).toString('hex')
  return utils.getAddress(`0x${ethAddress}`)
}

/**
 * Creates a new Avalanche account using a randomly generated privateKey
 */
export async function newAccount(
  chain = ChainType.C_CHAIN,
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
