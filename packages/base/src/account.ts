import { Blockchain } from '@aleph-sdk/core'
import { ETHAccount } from '@aleph-sdk/ethereum'
import { ChainData, ChangeRpcParam, JsonRPCWallet, RpcId } from '@aleph-sdk/evm'
import * as bip39 from 'bip39'
import { providers, Wallet } from 'ethers'

/**
 * BaseAccount implements the Account class for the Base protocol.
 * It is used to represent a Base account when publishing a message on the Aleph network.
 */
export class BaseAccount extends ETHAccount {
  public constructor(wallet: Wallet | JsonRPCWallet, address: string, publicKey?: string, rpcId?: number) {
    super(wallet, address, publicKey, rpcId || RpcId.BASE)
  }

  override getChain(): Blockchain {
    return Blockchain.BASE
  }
}

/**
 * Imports an Base account given a mnemonic and the 'ethers' package.
 *
 * It creates an Base wallet containing information about the account, extracted in the BaseAccount constructor.
 *
 * @param mnemonic The mnemonic of the account to import.
 * @param derivationPath The derivation path used to retrieve the list of accounts attached to the given mnemonic.
 */
export function importAccountFromMnemonic(mnemonic: string, derivationPath = "m/44'/60'/0'/0/0"): BaseAccount {
  const wallet = Wallet.fromMnemonic(mnemonic, derivationPath)

  return new BaseAccount(wallet, wallet.address, wallet.publicKey)
}

/**
 * Imports an Base account given a private key and the 'ethers' package.
 *
 * It creates an Base wallet containing information about the account, extracted in the BaseAccount constructor.
 *
 * @param privateKey The private key of the account to import.
 */
export function importAccountFromPrivateKey(privateKey: string): BaseAccount {
  const wallet = new Wallet(privateKey)

  return new BaseAccount(wallet, wallet.address, wallet.publicKey)
}

/**
 * Creates a new Base account using a generated mnemonic following BIP 39 standard.
 *
 * @param derivationPath
 */
export function newAccount(derivationPath = "m/44'/60'/0'/0/0"): { account: BaseAccount; mnemonic: string } {
  const mnemonic = bip39.generateMnemonic()

  return { account: importAccountFromMnemonic(mnemonic, derivationPath), mnemonic: mnemonic }
}

/**
 * Get an account from a Web3 provider (ex: Metamask)
 *
 * @param  {providers.ExternalProvider | providers.Web3Provider} provider
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function getAccountFromProvider(
  provider: providers.ExternalProvider | providers.Web3Provider,
  requestedRpc: ChangeRpcParam = RpcId.BASE,
): Promise<BaseAccount> {
  const ETHprovider = provider instanceof providers.Web3Provider ? provider : new providers.Web3Provider(provider)
  const jrw = new JsonRPCWallet(ETHprovider)

  const chainId = Number((typeof requestedRpc === 'number' ? ChainData[requestedRpc] : requestedRpc).chainId)
  if (chainId !== (await jrw.provider.getNetwork()).chainId) await jrw.changeNetwork(requestedRpc)
  await jrw.connect()

  if (jrw.address)
    return new BaseAccount(jrw, jrw.address, undefined, typeof requestedRpc === 'number' ? requestedRpc : undefined)
  throw new Error('Insufficient permissions')
}
