import EthApp from '@ledgerhq/hw-app-eth'
import semver from 'semver'

import { Blockchain, JSExecutionEnvironment } from '@aleph-sdk/core'
import { Account, SignableMessage } from '@aleph-sdk/account'
import { getTransport } from './transport'

const DERIVATION_PATH = "44'/60'/0'/0/0"

/**
 * The ETHLedgerAccount represents an ETHAccount with Signing functionalities
 * Instanciated from a Ledger device
 */
export class ETHLedgerAccount extends Account {
  private signer: EthApp

  constructor(signer: EthApp, address: string) {
    super(address)
    this.signer = signer
  }

  GetChain(): Blockchain {
    return Blockchain.ETH
  }

  private async getSignature(input: Buffer) {
    const rsv = await this.signer.signPersonalMessage(DERIVATION_PATH, input.toString('hex'))
    const { r, s } = rsv
    const v = Number(rsv.v - 27)
      .toString(16)
      .padStart(2, '0')

    return `0x${r}${s}${v}`
  }

  /**
   * Signs a message using the Ledger's Private Key
   * @param message The message to signe
   */
  async Sign(message: SignableMessage): Promise<string> {
    if (message.GetVerificationBuffer === undefined)
      throw new Error("message doesn't have a valid GetVerificationBuffer method")

    const buffer = message.GetVerificationBuffer()

    return this.getSignature(buffer)
  }
}

/**
 * This method retrieves an Ethereum account from a connected Ledger device
 */
export async function GetAccountFromLedger(overrideEnvironment?: JSExecutionEnvironment): Promise<ETHLedgerAccount> {
  const transport = await getTransport(overrideEnvironment)
  const signer = new EthApp(transport)

  const { version } = await signer.getAppConfiguration()
  if (semver.lt(version, '1.9.19')) {
    throw new Error('Outdated Ledger device firmware. PLease update')
  }

  const { address } = await signer.getAddress(DERIVATION_PATH)

  return new ETHLedgerAccount(signer, address)
}
