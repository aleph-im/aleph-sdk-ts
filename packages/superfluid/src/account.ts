import { Account, SignableMessage } from '@aleph-sdk/account'
import { AvalancheAccount, getAccountFromProvider as getAvalancheAccountFromProvider } from '@aleph-sdk/avalanche'
import { BaseAccount, getAccountFromProvider as getBaseAccountFromProvider } from '@aleph-sdk/base'
import { Blockchain } from '@aleph-sdk/core'
import { getAccountFromProvider as getEthereumAccountFromProvider } from '@aleph-sdk/ethereum'
import {
  alephToWei,
  ChainData,
  ChangeRpcParam,
  EVMAccount,
  findChainMetadataByChainId,
  hexToDec,
  JsonRPCWallet,
  RpcId,
  weiToAleph,
} from '@aleph-sdk/evm'
import superfluidMetadata from '@superfluid-finance/metadata'
import { Decimal } from 'decimal.js'
import { BrowserProvider, Contract, Eip1193Provider } from 'ethers'

const erc20BalanceAbi = ['function balanceOf(address account) view returns (uint256)']
const cfaV1ForwarderAbi = [
  'function getFlowrate(address token, address sender, address receiver) view returns (int96)',
  'function setFlowrate(address token, address receiver, int96 flowrate) returns (bool)',
]

/**
 * SuperfluidAccount implements the Account class for the Superfluid protocol, now for AVAX and BASE chains.
 * It is used to represent a Superfluid account when publishing a message on the Aleph network.
 */

export class SuperfluidAccount extends EVMAccount {
  public override wallet: JsonRPCWallet
  private account: EVMAccount
  private initialized = false
  private superTokenAddress?: string
  private forwarderAddress?: string

  constructor(account: EVMAccount) {
    super(account.address, account.publicKey)
    this.account = account
    if (account.wallet instanceof JsonRPCWallet) this.wallet = account.wallet
    else throw new Error('Unsupported wallet type')
  }

  public async init(): Promise<void> {
    await this.wallet.connect()

    const currentChainId = await this.getChainId()
    const network = superfluidMetadata.getNetworkByChainId(currentChainId)
    if (!network) throw new Error(`ChainID ${currentChainId} not supported`)

    const superTokenAddress = findChainMetadataByChainId(currentChainId)?.superTokenAddress
    if (!superTokenAddress) throw new Error(`ChainID ${currentChainId} not supported`)

    this.forwarderAddress = network.contractsV1.cfaV1Forwarder
    this.superTokenAddress = superTokenAddress
    this.initialized = true
  }

  public override async askPubKey() {
    return this.account.askPubKey()
  }

  public override getChain() {
    return this.account.getChain()
  }

  public override async sign(message: SignableMessage) {
    return this.account.sign(message)
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.superTokenAddress || !this.forwarderAddress) {
      throw new Error('SuperfluidAccount not initialized')
    }
  }

  private alephPerHourToFlowRate(alephPerHour: Decimal | number): bigint {
    return alephToWei(alephPerHour) / 3600n
  }

  private flowRateToAlephPerHour(flowRate: bigint | string | number): Decimal {
    return weiToAleph(BigInt(flowRate) * 3600n)
  }

  private async getFlowRate(receiver: string): Promise<bigint> {
    this.ensureInitialized()

    const forwarder = new Contract(this.forwarderAddress!, cfaV1ForwarderAbi, this.wallet.provider)
    const flowRate = await forwarder.getFlowrate(this.superTokenAddress!, this.address, receiver)

    return BigInt(flowRate)
  }

  private async setFlowRate(receiver: string, flowRate: bigint): Promise<void> {
    this.ensureInitialized()

    const signer = await this.wallet.getSigner()
    const forwarder = new Contract(this.forwarderAddress!, cfaV1ForwarderAbi, signer)
    const transaction = await forwarder.setFlowrate(this.superTokenAddress!, receiver, flowRate)

    await transaction.wait()
  }

  /**
   * Get the ALEPH balance of the account.
   */
  public override async getALEPHBalance(): Promise<Decimal> {
    this.ensureInitialized()

    const token = new Contract(this.superTokenAddress!, erc20BalanceAbi, this.wallet.provider)
    const balance = await token.balanceOf(this.address)

    return weiToAleph(BigInt(balance))
  }

  /**
   * Get the ALEPH flow rate to a given receiver in ALEPH per hour.
   * @param receiver The receiver address.
   */
  public async getALEPHFlow(receiver: string): Promise<Decimal> {
    const flowRate = await this.getFlowRate(receiver)

    if (flowRate === 0n) return new Decimal(0)

    return this.flowRateToAlephPerHour(flowRate)
  }

  /**
   * Increase the ALEPH flow rate to a given receiver. Creates a new flow if none exists.
   * @param receiver The receiver address.
   * @param alephPerHour The amount of ALEPH per hour to increase the flow by.
   */
  public async increaseALEPHFlow(receiver: string, alephPerHour: Decimal | number): Promise<void> {
    const balance = await this.getALEPHBalance()
    if (balance.lt(alephPerHour)) throw new Error('Not enough ALEPH to increase flow')

    const currentFlowRate = await this.getFlowRate(receiver)
    const flowRate = currentFlowRate + this.alephPerHourToFlowRate(alephPerHour)

    await this.setFlowRate(receiver, flowRate)
  }

  /**
   * Decrease the ALEPH flow rate to a given receiver. Deletes the flow if the new flow rate is 0.
   * @param receiver The receiver address.
   * @param alephPerHour The amount of ALEPH per hour to decrease the flow by.
   */
  public async decreaseALEPHFlow(receiver: string, alephPerHour: Decimal | number): Promise<void> {
    const currentFlowRate = await this.getFlowRate(receiver)
    if (currentFlowRate === 0n) throw new Error('No flow to decrease flow')

    const flowRate = currentFlowRate - this.alephPerHourToFlowRate(alephPerHour)

    await this.setFlowRate(receiver, flowRate > 0n ? flowRate : 0n)
  }
}

export function isBlockchainSupported(blockchain: Blockchain | undefined): boolean {
  if (!blockchain) return false

  return [Blockchain.AVAX, Blockchain.BASE].includes(blockchain)
}

export function isAccountSupported(account: Account | undefined): boolean {
  if (!account) return false

  return account instanceof AvalancheAccount || account instanceof BaseAccount
}

export async function createFromEVMAccount(account: EVMAccount): Promise<SuperfluidAccount> {
  if (!account.wallet) throw new Error('Wallet is required')

  const superfluidAccount = new SuperfluidAccount(account)
  await superfluidAccount.init()

  return superfluidAccount
}

export async function getAccountFromProvider(
  provider: Eip1193Provider | BrowserProvider,
  requestedRpc: ChangeRpcParam = RpcId.AVAX,
): Promise<SuperfluidAccount> {
  let networkInfo: number
  if (typeof requestedRpc === 'number') {
    networkInfo = hexToDec(ChainData[requestedRpc].chainId)
  } else {
    networkInfo = hexToDec(requestedRpc.chainId)
  }

  let account: EVMAccount
  if ([hexToDec(ChainData[RpcId.AVAX].chainId), hexToDec(ChainData[RpcId.AVAX_TESTNET].chainId)].includes(networkInfo))
    account = await getAvalancheAccountFromProvider(provider)
  else if (
    [hexToDec(ChainData[RpcId.BASE].chainId), hexToDec(ChainData[RpcId.BASE_TESTNET].chainId)].includes(networkInfo)
  )
    account = await getBaseAccountFromProvider(provider)
  else if (
    [
      hexToDec(ChainData[RpcId.ETH].chainId),
      hexToDec(ChainData[RpcId.ETH_FLASHBOTS].chainId),
      hexToDec(ChainData[RpcId.ETH_SEPOLIA].chainId),
    ].includes(networkInfo)
  )
    account = await getEthereumAccountFromProvider(provider)
  else throw new Error(`Unsupported Chain: ${requestedRpc}`)

  return createFromEVMAccount(account)
}
