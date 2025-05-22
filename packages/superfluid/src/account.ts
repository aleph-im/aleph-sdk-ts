import { Account, SignableMessage } from '@aleph-sdk/account'
import { AvalancheAccount, getAccountFromProvider as getAvalancheAccountFromProvider } from '@aleph-sdk/avalanche'
import { BaseAccount, getAccountFromProvider as getBaseAccountFromProvider } from '@aleph-sdk/base'
import { Blockchain } from '@aleph-sdk/core'
import { getAccountFromProvider as getEthereumAccountFromProvider } from '@aleph-sdk/ethereum'
import {
  ChainData,
  ChangeRpcParam,
  EVMAccount,
  findChainMetadataByChainId,
  hexToDec,
  JsonRPCWallet,
  RpcId,
  alephToWei,
  weiToAleph,
} from '@aleph-sdk/evm'
import { Framework, SuperToken } from '@superfluid-finance/sdk-core'
import { Decimal } from 'decimal.js'
import { Wallet, BigNumber, providers, utils } from 'ethers'

/**
 * SuperfluidAccount implements the Account class for the Superfluid protocol, now for AVAX and BASE chains.
 * It is used to represent a Superfluid account when publishing a message on the Aleph network.
 */

export class SuperfluidAccount extends EVMAccount {
  public override wallet: JsonRPCWallet
  private account: EVMAccount
  private framework?: Framework
  private alephx?: SuperToken

  constructor(account: EVMAccount) {
    super(account.address, account.publicKey)
    this.account = account
    if (account.wallet instanceof JsonRPCWallet) this.wallet = account.wallet
    else if (account.wallet instanceof providers.JsonRpcProvider || account.wallet instanceof Wallet)
      this.wallet = new JsonRPCWallet(account.wallet)
    else throw new Error('Unsupported wallet type')
  }

  public async init(): Promise<void> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    await this.wallet.connect()

    if (!this.framework) {
      this.framework = await Framework.create({
        chainId: await this.wallet.getCurrentChainId(),
        provider: this.wallet.provider,
      })
    }

    const currentChainId = await this.getChainId()
    const superTokenAddress = findChainMetadataByChainId(currentChainId)?.superTokenAddress

    if (!superTokenAddress) throw new Error(`ChainID ${currentChainId} not supported`)

    this.alephx = await this.framework.loadSuperToken(superTokenAddress)
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

  private alephPerHourToFlowRate(alephPerHour: Decimal | number): BigNumber {
    return alephToWei(alephPerHour).div(BigNumber.from(3600))
  }

  private flowRateToAlephPerHour(flowRate: BigNumber | string): Decimal {
    return new Decimal(utils.formatEther(BigNumber.from(flowRate).mul(BigNumber.from(3600))))
  }

  /**
   * Get the ALEPH balance of the account.
   */
  public override async getALEPHBalance(): Promise<Decimal> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')

    const balance = await this.alephx.balanceOf({
      account: this.address,
      providerOrSigner: this.wallet.provider,
    })

    return weiToAleph(balance)
  }

  /**
   * Get the ALEPH flow rate to a given receiver in ALEPH per hour.
   * @param receiver The receiver address.
   */
  public async getALEPHFlow(receiver: string): Promise<Decimal> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')

    const flow = await this.alephx.getFlow({
      sender: this.address,
      receiver,
      providerOrSigner: this.wallet.provider,
    })

    if (!flow) return new Decimal(0)

    return this.flowRateToAlephPerHour(flow.flowRate)
  }

  /**
   * Increase the ALEPH flow rate to a given receiver. Creates a new flow if none exists.
   * @param receiver The receiver address.
   * @param alephPerHour The amount of ALEPH per hour to increase the flow by.
   */
  public async increaseALEPHFlow(receiver: string, alephPerHour: Decimal | number): Promise<void> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount is not initialized')

    // check wrapped balance, if none throw
    const balance = BigNumber.from(
      await this.alephx.balanceOf({ account: this.address, providerOrSigner: this.wallet.provider }),
    )
    if (balance.lt(alephToWei(alephPerHour))) throw new Error('Not enough ALEPH to increase flow')

    const signer = this.wallet.provider.getSigner()
    const sender = this.address
    const flow = await this.getFlow(receiver)

    const newFlowRate = flow
      ? BigNumber.from(flow.flowRate.toString()).add(this.alephPerHourToFlowRate(alephPerHour))
      : this.alephPerHourToFlowRate(alephPerHour)

    const operation = flow
      ? this.alephx.updateFlow({ sender, receiver, flowRate: newFlowRate.toString() })
      : this.alephx.createFlow({ sender, receiver, flowRate: newFlowRate.toString() })

    await operation.exec(signer)
  }

  /**
   * Decrease the ALEPH flow rate to a given receiver. Deletes the flow if the new flow rate is 0.
   * @param receiver The receiver address.
   * @param alephPerHour The amount of ALEPH per hour to decrease the flow by.
   */
  public async decreaseALEPHFlow(receiver: string, alephPerHour: Decimal | number): Promise<void> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')

    const flow = await this.getFlow(receiver)
    if (!flow) throw new Error('No flow to decrease flow')

    const sender = this.address
    const signer = this.wallet.provider.getSigner()
    const newFlowRate = BigNumber.from(flow.flowRate.toString()).sub(this.alephPerHourToFlowRate(alephPerHour))

    const operation = newFlowRate.lte(0)
      ? this.alephx.deleteFlow({ sender, receiver })
      : this.alephx.updateFlow({ sender, receiver, flowRate: newFlowRate.toString() })

    await operation.exec(signer)
  }

  private async getFlow(receiver: string) {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')

    const fetchedFlow = await this.alephx.getFlow({
      sender: this.address,
      receiver,
      providerOrSigner: this.wallet.provider,
    })

    return !fetchedFlow || BigNumber.from(fetchedFlow.flowRate).eq(0) ? null : fetchedFlow
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
  provider: providers.ExternalProvider,
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
