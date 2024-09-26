import { SignableMessage } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'
import { ChainMetadata, ChangeRpcParam, EVMAccount, hexToDec, JsonRPCWallet, RpcId } from '@aleph-sdk/evm'
import * as bip39 from 'bip39'
import { providers, Wallet } from 'ethers'

/**
 * ETHAccount implements the Account class for the Ethereum protocol.
 * It is used to represent an ethereum account when publishing a message on the Aleph network.
 */
export class ETHAccount extends EVMAccount {
  public override readonly wallet: Wallet | JsonRPCWallet

  public constructor(wallet: Wallet | JsonRPCWallet, address: string, publicKey?: string, rpcId?: number) {
    super(address, publicKey)
    this.selectedRpcId = rpcId || RpcId.ETH
    if (wallet instanceof Wallet && !wallet.provider) {
      const network = ChainMetadata[rpcId || this.selectedRpcId]
      const provider = new providers.JsonRpcProvider(network.rpcUrls.at(0), {
        name: network.chainName,
        chainId: hexToDec(network.chainId),
      })
      this.wallet = new JsonRPCWallet(wallet.connect(provider))
    } else {
      this.wallet = wallet
    }
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

    if (this.wallet instanceof Wallet) {
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
export function importAccountFromMnemonic(mnemonic: string, derivationPath = "m/44'/60'/0'/0/0"): ETHAccount {
  const wallet = Wallet.fromMnemonic(mnemonic, derivationPath)

  return new ETHAccount(wallet, wallet.address, wallet.publicKey)
}

/**
 * Imports an ethereum account given a private key and the 'ethers' package.
 *
 * It creates an ethereum wallet containing information about the account, extracted in the ETHAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function importAccountFromPrivateKey(privateKey: string): ETHAccount {
  const wallet = new Wallet(privateKey)

  return new ETHAccount(wallet, wallet.address, wallet.publicKey)
}

/**
 * Creates a new ethereum account using a generated mnemonic following BIP 39 standard.
 *
 * @param derivationPath
 */
export function newAccount(derivationPath = "m/44'/60'/0'/0/0"): { account: ETHAccount; mnemonic: string } {
  const mnemonic = bip39.generateMnemonic()

  return { account: importAccountFromMnemonic(mnemonic, derivationPath), mnemonic: mnemonic }
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {ethers.providers.ExternalProvider | ethers.providers.Web3Provider} provider
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function getAccountFromProvider(
  provider: providers.ExternalProvider | providers.Web3Provider,
  requestedRpc: ChangeRpcParam = RpcId.ETH,
): Promise<ETHAccount> {
  const ETHprovider = provider instanceof providers.Web3Provider ? provider : new providers.Web3Provider(provider)
  const jrw = new JsonRPCWallet(ETHprovider)

  const chainId = hexToDec((typeof requestedRpc === 'number' ? ChainMetadata[requestedRpc] : requestedRpc).chainId)
  if (chainId !== (await jrw.getCurrentChainId())) await jrw.changeNetwork(requestedRpc)
  await jrw.connect()

  if (jrw.address)
    return new ETHAccount(jrw, jrw.address, undefined, typeof requestedRpc === 'number' ? requestedRpc : undefined)
  throw new Error('Insufficient permissions')
}
