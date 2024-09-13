/**
 * This code was based on https://github.com/rsksmart/mock-web3-provider
 * some methods where changed and updated
 * Under MIT LICENSE
 */

import { personalSign } from '@metamask/eth-sig-util'
import { ethers } from 'ethers'

type ProviderSetup = {
  address: string
  privateKey: string
  networkVersion: number
  debug?: boolean
  manualConfirmEnable?: boolean
}

interface IMockProvider {
  request(args: { method: 'eth_accounts'; params: string[] }): Promise<string[]>
  request(args: { method: 'eth_requestAccounts'; params: string[] }): Promise<string[]>

  request(args: { method: 'net_version' }): Promise<number>
  request(args: { method: 'eth_chainId'; params: string[] }): Promise<string>

  request(args: { method: 'personal_sign'; params: string[] }): Promise<string>
  request(args: { method: 'eth_decrypt'; params: string[] }): Promise<string>

  request(args: { method: string; params?: any[] }): Promise<any>
}

export class EthereumMockProvider implements IMockProvider {
  private setup: ProviderSetup
  public isMetaMask = true

  constructor(setup: ProviderSetup) {
    this.setup = setup
  }

  // eslint-disable-next-line no-console
  private log = (...args: (any | null)[]) => this.setup.debug && console.log('🦄', ...args)

  get selectedAddress(): string {
    return this.setup.address
  }

  get chainId(): string {
    return `0x${this.setup.networkVersion.toString(16)}`
  }

  getSigner(): ethers.Signer {
    return new ethers.Wallet(this.setup.privateKey)
  }

  request({ method, params }: { method: string; params?: any[] }): Promise<any> {
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
        const privateKey = Buffer.from(this.setup.privateKey, 'hex')

        const signed: string = personalSign({ privateKey, data: params[0] })

        this.log('signed', signed)

        return Promise.resolve(signed)
      }

      case 'wallet_addEthereumChain': {
        return Promise.resolve()
      }

      case 'wallet_switchEthereumChain': {
        return Promise.resolve()
      }

      default:
        this.log(`requesting missing method ${method}`)
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(`The method ${method} is not implemented by the mock provider.`)
    }
  }
}
