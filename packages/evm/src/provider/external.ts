import { BaseProviderWallet } from '@aleph-sdk/account'
import { providers } from 'ethers'

/**
 * Wraps any async sign function as a BaseProviderWallet so it can be used
 * with ETHAccount and EVMAccount. Intended for embedded/smart-wallet signers
 * (e.g. Privy) that are not backed by a standard ethers.js wallet or Web3 provider.
 *
 * The caller must supply:
 * - address       — the account's on-chain address (SA for smart wallets)
 * - provider      — a standard JSON-RPC provider for balance/chain queries
 * - signMessage   — the signing function (e.g. smartWalletClient.signMessage)
 */
export class ExternalSignerWallet extends BaseProviderWallet {
  public readonly address: string
  public override readonly provider: providers.JsonRpcProvider
  private readonly _signMessage: (message: Buffer | string) => Promise<string>

  constructor(
    address: string,
    provider: providers.JsonRpcProvider,
    signMessage: (message: Buffer | string) => Promise<string>,
  ) {
    super()
    this.address = address
    this.provider = provider
    this._signMessage = signMessage
  }

  async connect(): Promise<void> {
    // No-op: address is known at construction time
  }

  async signMessage(data: Buffer | string): Promise<string> {
    return this._signMessage(data)
  }

  async getCurrentChainId(): Promise<number> {
    const network = await this.provider.getNetwork()
    return network.chainId
  }

  async getPublicKey(): Promise<string> {
    // ECIES encryption was removed in v1.0.0 and is not yet re-enabled.
    // Throw until the SDK re-introduces encryption support.
    throw new Error(
      'ExternalSignerWallet: getPublicKey is not supported. ' +
      'ECIES encryption is not yet available for external signer accounts.',
    )
  }

  isMetamask(): boolean {
    return false
  }
}
