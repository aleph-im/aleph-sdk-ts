/**
 * This code was based on https://github.com/rsksmart/mock-web3-provider
 * some methods where changed and updated
 * Under MIT LICENSE
 */

import { decrypt, getEncryptionPublicKey, personalSign } from '@metamask/eth-sig-util'

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

  request({ method, params }: { method: string; params?: any[] }): Promise<any> {
    this.log(`request[${method}]`)

    switch (method) {
      case 'wallet_requestPermissions':
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

      case 'eth_getEncryptionPublicKey': {
        const privateKey = this.setup.privateKey
        return Promise.resolve(getEncryptionPublicKey(privateKey))
      }

      case 'eth_decrypt': {
        this.log('eth_decrypt', { method, params })

        if (!params || !params[0]) throw new Error('Provide an encrypted payload.')

        const stripped = params[0].substring(2)
        const buff = Buffer.from(stripped, 'hex')
        const encryptedData = JSON.parse(buff.toString('utf8'))

        const decrypted: string = decrypt({ encryptedData, privateKey: this.setup.privateKey })

        return Promise.resolve(decrypted)
      }

      case 'wallet_addEthereumChain': {
        return Promise.resolve()
      }

      case 'wallet_switchEthereumChain': {
        return Promise.resolve()
      }

      default:
        this.log(`resquesting missing method ${method}`)
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(`The method ${method} is not implemented by the mock provider.`)
    }
  }
}
