import { Framework, SuperToken } from '@superfluid-finance/sdk-core'
import { AvalancheAccount } from '@aleph-sdk/avalanche'
import { ChainData, ChangeRpcParam, decToHex, hexToDec, JsonRPCWallet, RpcId } from '@aleph-sdk/evm'
import { BigNumber, ethers, providers } from 'ethers'
import {
  ALEPH_SUPERFLUID_FUJI_TESTNET,
  ALEPH_SUPERFLUID_MAINNET,
  SUPERFLUID_FUJI_TESTNET_SUBGRAPH_URL,
  SUPERFLUID_MAINNET_SUBGRAPH_URL,
} from '@aleph-sdk/core'
import { Decimal } from 'decimal.js'
import { BaseProviderWallet } from '@aleph-sdk/account'

/**
 * SuperfluidAccount implements the Account class for the Superfluid protocol.
 * It is used to represent a Superfluid account when publishing a message on the Aleph network.
 */

export class SuperfluidAccount extends AvalancheAccount {
  public override wallet: JsonRPCWallet
  private framework?: Framework
  private alephx?: SuperToken

  constructor(wallet: BaseProviderWallet | ethers.providers.JsonRpcProvider, address: string, publicKey?: string) {
    super(wallet, address, publicKey)
    if (wallet instanceof JsonRPCWallet) this.wallet = wallet
    else if (wallet instanceof ethers.providers.JsonRpcProvider) this.wallet = new JsonRPCWallet(wallet)
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
    if (!this.alephx) {
      if (ChainData[RpcId.AVAX_TESTNET].chainId === decToHex(await this.getChainId())) {
        this.alephx = await this.framework.loadSuperToken(ALEPH_SUPERFLUID_FUJI_TESTNET)
      } else if (ChainData[RpcId.AVAX].chainId === decToHex(await this.getChainId())) {
        this.alephx = await this.framework.loadSuperToken(ALEPH_SUPERFLUID_MAINNET)
      } else {
        throw new Error(`ChainID ${await this.getChainId()} not supported`)
      }
    }
  }

  private alephToWei(alephAmount: Decimal | number): ethers.BigNumber {
    // @note: Need to pre-multiply the number as Decimal in order to correctly parse as BigNumber
    const alephAmountBN = new Decimal(alephAmount).mul(10 ** 18)
    return ethers.BigNumber.from(alephAmountBN.toString())
  }

  private weiToAleph(weiAmount: ethers.BigNumber | string): Decimal {
    return new Decimal(ethers.utils.formatEther(ethers.BigNumber.from(weiAmount)))
  }

  private alephPerHourToFlowRate(alephPerHour: Decimal | number): ethers.BigNumber {
    return this.alephToWei(alephPerHour).div(ethers.BigNumber.from(3600))
  }

  private flowRateToAlephPerHour(flowRate: ethers.BigNumber | string): Decimal {
    return new Decimal(ethers.utils.formatEther(ethers.BigNumber.from(flowRate).mul(ethers.BigNumber.from(3600))))
  }

  /**
   * Get the regular ALEPH balance of the account.
   */
  public async getALEPHBalance(): Promise<Decimal> {
    // @todo: implement
    return new Decimal(0)
  }

  /**
   * Get the wrapped ALEPHx balance of the account.
   */
  public async getALEPHxBalance(): Promise<Decimal> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')
    const balance = await this.alephx.balanceOf({ account: this.address, providerOrSigner: this.wallet.provider })
    return this.weiToAleph(balance)
  }

  /**
   * Get the ALEPHx flow rate to a given receiver in ALEPHx per hour.
   * @param receiver The receiver address.
   */
  public async getALEPHxFlow(receiver: string): Promise<Decimal> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')
    const flow = await this.alephx.getFlow({
      sender: this.address,
      receiver,
      providerOrSigner: this.wallet.provider,
    })
    if (!flow) {
      return new Decimal(0)
    } else {
      return this.flowRateToAlephPerHour(flow.flowRate)
    }
  }

  /**
   * Get the net ALEPHx flow rate of the account in ALEPHx per hour.
   */
  public async getNetALEPHxFlow(): Promise<Decimal> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')
    const flow = await this.alephx.getNetFlow({
      account: this.address,
      providerOrSigner: this.wallet.provider,
    })
    return this.flowRateToAlephPerHour(flow)
  }

  public async getAllALEPHxOutflows(): Promise<Record<string, Decimal>> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.framework || !this.alephx) throw new Error('SuperfluidAccount not initialized')
    // make a graphql query to Superfluid Subgraph
    const query = `
            query {
              accounts(where: {outflows_: {sender: ${this.address}}}) {
                id
                outflows(where: {currentFlowRate_not: "0"}) {
                  sender {
                    id
                  }
                  receiver {
                    id
                  }
                  createdAtTimestamp
                  currentFlowRate
                }
              }
            }
        `
    const data = await this.querySubgraph(query)
    const accounts = data.data.accounts
    const outflows: Record<string, Decimal> = {}
    for (const account of accounts) {
      for (const outflow of account.outflows) {
        const flowRate = this.flowRateToAlephPerHour(outflow.currentFlowRate)
        if (outflow.sender.id === this.address) {
          outflows[outflow.sender.id] = flowRate
        }
      }
    }
    return outflows
  }

  private async querySubgraph(query: string) {
    const response = await fetch(await this.getSubgraphUrl(), {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
    return await response.json()
  }

  public async getAllALEPHxInflows(): Promise<Record<string, Decimal>> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.framework || !this.alephx) throw new Error('SuperfluidAccount not initialized')
    // make a graphql query to Superfluid Subgraph
    const query = `
            query {
              accounts(where: {inflows_: {receiver: ${this.address}}}) {
                id
                inflows(where: {currentFlowRate_not: "0"}) {
                  sender {
                    id
                  }
                  receiver {
                    id
                  }
                  createdAtTimestamp
                  currentFlowRate
                }
              }
            }
        `
    const data = await this.querySubgraph(query)
    const accounts = data.data.accounts
    const inflows: Record<string, Decimal> = {}
    for (const account of accounts) {
      for (const inflow of account.inflows) {
        const flowRate = this.flowRateToAlephPerHour(inflow.currentFlowRate)
        if (inflow.receiver.id === this.address) {
          inflows[inflow.sender.id] = flowRate
        }
      }
    }
    return inflows
  }

  private async getSubgraphUrl() {
    if (ChainData[RpcId.AVAX_TESTNET].chainId === decToHex(await this.getChainId())) {
      return SUPERFLUID_FUJI_TESTNET_SUBGRAPH_URL
    } else if (ChainData[RpcId.AVAX].chainId === decToHex(await this.getChainId())) {
      return SUPERFLUID_MAINNET_SUBGRAPH_URL
    } else {
      throw new Error(`ChainID ${await this.getChainId()} not supported`)
    }
  }

  /**
   * Increase the ALEPHx flow rate to a given receiver. Creates a new flow if none exists.
   * @param receiver The receiver address.
   * @param alephPerHour The amount of ALEPHx per hour to increase the flow by.
   */
  public async increaseALEPHxFlow(receiver: string, alephPerHour: Decimal | number): Promise<void> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount is not initialized')
    const flow = await this.alephx.getFlow({
      sender: this.address,
      receiver,
      providerOrSigner: this.wallet.provider,
    })
    // check wrapped balance, if none throw
    const balance = ethers.BigNumber.from(
      await this.alephx.balanceOf({ account: this.address, providerOrSigner: this.wallet.provider }),
    )
    if (balance.lt(this.alephToWei(alephPerHour))) {
      throw new Error('Not enough ALEPHx to increase flow')
    }
    const signer = this.wallet.provider.getSigner()
    if (!flow || BigNumber.from(flow.flowRate).eq(0)) {
      const op = this.alephx.createFlow({
        sender: this.address,
        receiver,
        flowRate: this.alephPerHourToFlowRate(alephPerHour).toString(),
      })
      await op.exec(signer)
    } else {
      const newFlowRate = ethers.BigNumber.from(flow.flowRate.toString()).add(this.alephPerHourToFlowRate(alephPerHour))
      const op = this.alephx.updateFlow({
        sender: this.address,
        receiver,
        flowRate: newFlowRate.toString(),
      })
      await op.exec(signer)
    }
  }

  /**
   * Decrease the ALEPHx flow rate to a given receiver. Deletes the flow if the new flow rate is 0.
   * @param receiver The receiver address.
   * @param alephPerHour The amount of ALEPHx per hour to decrease the flow by.
   */
  public async decreaseALEPHxFlow(receiver: string, alephPerHour: Decimal | number): Promise<void> {
    if (!this.wallet) throw Error('PublicKey Error: No providers are set up')
    if (!this.alephx) throw new Error('SuperfluidAccount not initialized')
    const flow = await this.alephx.getFlow({
      sender: this.address,
      receiver,
      providerOrSigner: this.wallet.provider,
    })
    if (!flow || BigNumber.from(flow.flowRate).eq(0)) return
    const newFlowRate = ethers.BigNumber.from(flow.flowRate.toString()).sub(this.alephPerHourToFlowRate(alephPerHour))
    const signer = this.wallet.provider.getSigner()
    if (newFlowRate.lte(0)) {
      const op = this.alephx.deleteFlow({
        sender: this.address,
        receiver,
      })
      await op.exec(signer)
    } else {
      const op = this.alephx.updateFlow({
        sender: this.address,
        receiver,
        flowRate: newFlowRate.toString(),
      })
      await op.exec(signer)
    }
  }
}

export function createFromAvalancheAccount(account: AvalancheAccount, rpc?: string): SuperfluidAccount {
  if (account.wallet) {
    return new SuperfluidAccount(account.wallet, account.address, account.publicKey)
  }
  throw new Error('Wallet is required')
  // @todo: implement for node.js
  if (!rpc) throw new Error('RPC or Provider is required')
  if (!account.keyPair) throw new Error('KeyPair is required')

  const rpcProvider = new ethers.providers.JsonRpcProvider(rpc)
  const provider = new JsonRPCWallet(rpcProvider)
  return new SuperfluidAccount(provider, account.address, account.publicKey)
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
  const web3Provider = new providers.Web3Provider(provider, networkInfo)
  const wallet = new JsonRPCWallet(web3Provider)
  if (!wallet.address) await wallet.connect()
  if (!wallet.address) throw new Error('PublicKey Error: No providers are set up')
  const account = new SuperfluidAccount(wallet, wallet.address)
  await account.changeNetwork(requestedRpc)
  await account.init()
  return account
}
