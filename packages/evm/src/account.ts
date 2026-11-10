import { ECIESAccount } from '@aleph-sdk/account'
import { Decimal } from 'decimal.js'
import { BaseWallet, Contract } from 'ethers'

import { ChainData, ChainMetadata, decToHex, ExternalSignerWallet, JsonRPCWallet, RpcId, RpcType } from './provider'
import { erc20Abi, weiToAleph } from './utils'

export abstract class EVMAccount extends ECIESAccount {
  public wallet?: BaseWallet | JsonRPCWallet | ExternalSignerWallet
  public selectedRpcId?: RpcId

  public async getChainId(): Promise<number> {
    if (this.wallet instanceof JsonRPCWallet) {
      return this.wallet.getCurrentChainId()
    }
    if (this.wallet instanceof ExternalSignerWallet) {
      return Number((await this.wallet.provider.getNetwork()).chainId)
    }
    if (this.wallet instanceof BaseWallet) {
      if (!this.wallet.provider) throw new Error('Wallet has no connected provider')
      return Number((await this.wallet.provider.getNetwork()).chainId)
    }
    if (!this.wallet) {
      throw new Error('EVMAccount has no connected wallet')
    }
    try {
      return await (this.wallet as JsonRPCWallet).getCurrentChainId()
    } catch (err: unknown) {
      throw new Error(`Could not get chainId: ${err}`)
    }
  }

  public getRpcUrl(): string {
    if (this.wallet instanceof JsonRPCWallet) {
      return this.wallet.getRpcUrl()
    }
    if (this.wallet instanceof ExternalSignerWallet) {
      return this.wallet.getRpcUrl()
    }
    if (this.wallet instanceof BaseWallet) {
      throw new Error('Wallet has no connected provider')
    }
    throw new Error('EVMAccount has no connected wallet')
  }

  public async getRpcId(): Promise<RpcId> {
    const chainId = await this.getChainId()
    const rpcUrl = this.getRpcUrl()
    if (!chainId && !rpcUrl) throw new Error('No chainId or rpcUrl provided')
    for (const [rpcChainType, chainData] of Object.entries(ChainData)) {
      if (rpcUrl) if (!chainData.rpcUrls.includes(rpcUrl)) continue
      if (chainId) if (chainData.chainId !== decToHex(chainId)) continue
      return parseInt(rpcChainType)
    }
    throw new Error('ChainId and/or rpcUrl not found in preset chains')
  }

  public async changeNetwork(chainOrRpc: RpcType | RpcId = RpcId.ETH): Promise<void> {
    if (this.wallet instanceof JsonRPCWallet) {
      await this.wallet.changeNetwork(chainOrRpc)
    } else if (this.wallet instanceof BaseWallet) {
      throw new Error('Not implemented for Wallet')
    }
  }

  /**
   * Retrieves the ALEPH token balance for a specified wallet address.
   */
  async getALEPHBalance(): Promise<Decimal> {
    const tokenAddress = ChainMetadata[this.selectedRpcId!].tokenAddress
    if (!tokenAddress) throw new Error('No token address found')
    if (this.wallet instanceof JsonRPCWallet) await this.wallet.connect()
    const provider = this.wallet!.provider as any
    const tokenContract = new Contract(tokenAddress, erc20Abi, provider)
    const balance = await tokenContract.balanceOf(this.wallet?.address)
    return weiToAleph(balance)
  }
}
