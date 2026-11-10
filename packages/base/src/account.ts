import { Blockchain } from '@aleph-sdk/core'
import { ETHAccount } from '@aleph-sdk/ethereum'
import { ChainData, ChangeRpcParam, hexToDec, JsonRPCWallet, RpcId } from '@aleph-sdk/evm'
import * as bip39 from 'bip39'
import { BaseWallet, BrowserProvider, Eip1193Provider, HDNodeWallet, Wallet } from 'ethers'

/**
 * BaseAccount implements the Account class for the Base protocol.
 * It is used to represent a Base account when publishing a message on the Aleph network.
 */
export class BaseAccount extends ETHAccount {
  public constructor(wallet: BaseWallet | JsonRPCWallet, address: string, publicKey?: string, rpcId?: number) {
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
  const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath)

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

  return new BaseAccount(wallet, wallet.address, wallet.signingKey.publicKey)
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
 * @param  {Eip1193Provider | BrowserProvider} provider
 * @param requestedRpc Use this params to change the RPC endpoint;
 */
export async function getAccountFromProvider(
  provider: Eip1193Provider | BrowserProvider,
  requestedRpc: ChangeRpcParam = RpcId.BASE,
): Promise<BaseAccount> {
  const ETHprovider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider)
  const jrw = new JsonRPCWallet(ETHprovider, provider instanceof BrowserProvider ? undefined : provider)

  const chainId = hexToDec((typeof requestedRpc === 'number' ? ChainData[requestedRpc] : requestedRpc).chainId)
  if (chainId !== (await jrw.getCurrentChainId())) await jrw.changeNetwork(requestedRpc)
  await jrw.connect()

  if (jrw.address)
    return new BaseAccount(jrw, jrw.address, undefined, typeof requestedRpc === 'number' ? requestedRpc : undefined)
  throw new Error('Insufficient permissions')
}
