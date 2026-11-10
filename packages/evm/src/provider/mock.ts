/**
 * This code was based on https://github.com/rsksmart/mock-web3-provider
 * some methods where changed and updated
 * Under MIT LICENSE
 */

import { EphAccount } from '@aleph-sdk/account'
import * as bip39 from 'bip39'
import { getBytes, HDNodeWallet, isHexString, Signer, Wallet } from 'ethers'

interface ProviderSetup {
  address: string
  privateKey: string
  networkVersion: number
  debug?: boolean
  manualConfirmEnable?: boolean
}

interface IMockProvider {
  request: (args: {
    method: 'eth_accounts' | 'eth_requestAccounts' | 'net_version' | 'eth_chainId' | 'personal_sign' | 'eth_decrypt'
    params?: any[]
  }) => Promise<any>
  on?: (event: string, handler: (...args: any[]) => any) => any
  emit?: (event: string, ...args: any[]) => any
  getNetworkVersion?: () => number
  getAddress?: () => string
  getPrivateKey?: () => string
  getSigner?: () => Signer
}

export class EthereumMockProvider implements IMockProvider {
  private setup: ProviderSetup
  public isMetaMask = true

  constructor(setup: ProviderSetup) {
    this.setup = setup
  }

  private log = (...args: (any | null)[]) => this.setup.debug && console.log('🦄', ...args)

  get selectedAddress(): string {
    return this.setup.address
  }

  get chainId(): string {
    return `0x${this.setup.networkVersion.toString(16)}`
  }

  getSigner(): Signer {
    return new Wallet(this.setup.privateKey)
  }

  async request({ method, params }: { method: string; params?: any[] }): Promise<any> {
    this.log(`request[${method}]`)

    switch (method) {
      case 'wallet_requestPermissions':
        return Promise.resolve()
      case 'eth_accounts':
        return Promise.resolve([this.selectedAddress])

      case 'eth_chainId':
        return Promise.resolve(this.chainId)

      case 'personal_sign': {
        if (!params) throw Error('Nothing to sign')
        const data = params[0]
        const message = typeof data === 'string' && isHexString(data) ? getBytes(data) : data

        const signed = await new Wallet(this.setup.privateKey).signMessage(message)

        this.log('signed', signed)

        return signed
      }

      case 'wallet_addEthereumChain': {
        return Promise.resolve()
      }

      case 'wallet_switchEthereumChain': {
        return Promise.resolve()
      }

      case 'eth_requestAccounts':
        return Promise.resolve([this.selectedAddress])

      case 'net_version':
        return Promise.resolve(this.setup.networkVersion)

      case 'eth_getEncryptionPublicKey':
        return Promise.resolve('0x1234567890abcdef1234567890abcdef12345678')

      default:
        this.log(`requesting missing method ${method}`)
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(`The method ${method} is not implemented by the mock provider.`)
    }
  }

  getNetworkVersion(): number {
    return this.setup.networkVersion
  }

  getAddress(): string {
    return this.setup.address
  }

  getPrivateKey(): string {
    return this.setup.privateKey
  }
}

export async function createEphemeralEth(): Promise<EphAccount> {
  const mnemonic = bip39.generateMnemonic()
  const { address, publicKey, privateKey } = HDNodeWallet.fromPhrase(mnemonic)

  return {
    address,
    publicKey,
    privateKey: privateKey.substring(2),
    mnemonic,
  }
}
