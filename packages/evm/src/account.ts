import { ethers } from 'ethers'
import { BaseProviderWallet, ECIESAccount } from '@aleph-sdk/account'
import { ChainData, decToHex, JsonRPCWallet, RpcId, RpcType } from './provider'

export abstract class EVMAccount extends ECIESAccount {
  public wallet?: ethers.Wallet | BaseProviderWallet

  public async getChainId(): Promise<number> {
    if (this.wallet instanceof JsonRPCWallet) {
      return this.wallet.provider.network.chainId
    }
    if (this.wallet instanceof ethers.Wallet) {
      return (await this.wallet.provider.getNetwork()).chainId
    }
    if (!this.wallet) {
      throw new Error('EVMAccount has no connected wallet')
    }
    try {
      return (this.wallet as JsonRPCWallet).provider.network.chainId
    } catch (err: unknown) {
      throw new Error(`Could not get chainId: ${err}`)
    }
  }

  public getRpcUrl(): string {
    if (this.wallet instanceof JsonRPCWallet) {
      return this.wallet.provider.connection.url
    }
    if (this.wallet instanceof ethers.Wallet) {
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
    } else if (this.wallet instanceof ethers.Wallet) {
      throw new Error('Not implemented for ethers.Wallet')
    }
  }
}
