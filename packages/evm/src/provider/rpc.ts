import { BaseProviderWallet } from '@aleph-sdk/account'
import { providers, Wallet } from 'ethers'

import { MetamaskErrorCodes } from './constants'

const RPC_WARNING = `DEPRECATION WARNING:
Encryption/Decryption features may become obsolete, for more information: https://github.com/aleph-im/aleph-sdk-ts/issues/37`

export enum RpcId {
  ETH,
  ETH_FLASHBOTS,
  ETH_SEPOLIA,
  AVAX,
  AVAX_TESTNET,
  BASE,
  BASE_TESTNET,
  POLYGON,
  BSC,
}

export type RpcType = {
  chainId: string
  rpcUrls: string[]
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorerUrls: string[]
}

export type ChainMetadataType = RpcType & {
  tokenAddress?: string
  superTokenAddress?: string
}

export type ChangeRpcParam = RpcType | RpcId

export function decToHex(dec: number): string {
  return '0x' + dec.toString(16)
}

export function hexToDec(hex: string): number {
  return parseInt(hex.slice(2), 16)
}

export const ChainData: { [key: number]: RpcType } = {
  [RpcId.AVAX]: {
    chainId: decToHex(43114),
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    chainName: 'Avalanche Mainnet',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    blockExplorerUrls: ['https://snowtrace.io'],
  },
  [RpcId.AVAX_TESTNET]: {
    chainId: decToHex(43113),
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    chainName: 'Avalanche Fuji (Testnet)',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
  },
  [RpcId.ETH]: {
    chainId: decToHex(1),
    rpcUrls: ['https://eth-mainnet.public.blastapi.io'],
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  [RpcId.ETH_FLASHBOTS]: {
    chainId: decToHex(1),
    rpcUrls: ['https://rpc.flashbots.net'],
    chainName: 'Ethereum Mainnet - Flashbots',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  [RpcId.ETH_SEPOLIA]: {
    chainId: decToHex(11155111),
    rpcUrls: ['https://eth-sepolia.public.blastapi.io'],
    chainName: 'Ethereum Sepolia (Testnet)',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  [RpcId.POLYGON]: {
    chainId: decToHex(137),
    rpcUrls: ['https://polygon-rpc.com'],
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  [RpcId.BSC]: {
    chainId: decToHex(56),
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    chainName: 'Binance Smart Chain Mainnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    blockExplorerUrls: ['https://bscscan.com'],
  },
  [RpcId.BASE]: {
    chainId: decToHex(8453),
    rpcUrls: ['https://mainnet.base.org'],
    chainName: 'Base Mainnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://basescan.org'],
  },
  [RpcId.BASE_TESTNET]: {
    chainId: decToHex(84532),
    rpcUrls: ['https://sepolia.base.org'],
    chainName: 'Base Sepolia (Testnet)',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['	https://sepolia-explorer.base.org'],
  },
}

export const ChainMetadata: { [key: number]: ChainMetadataType } = {
  ...ChainData,
  [RpcId.ETH]: {
    ...ChainData[RpcId.ETH],
    tokenAddress: '0x27702a26126e0B3702af63Ee09aC4d1A084EF628',
  },
  [RpcId.ETH_SEPOLIA]: {
    ...ChainData[RpcId.ETH_SEPOLIA],
    tokenAddress: '0xc4bf5cbdabe595361438f8c6a187bdc330539c60',
    superTokenAddress: '0x22064a21fee226d8ffb8818e7627d5ff6d0fc33a',
  },
  [RpcId.AVAX]: {
    ...ChainData[RpcId.AVAX],
    tokenAddress: '0xc0Fbc4967259786C743361a5885ef49380473dCF',
    superTokenAddress: '0xc0Fbc4967259786C743361a5885ef49380473dCF',
  },
  [RpcId.AVAX_TESTNET]: {
    ...ChainData[RpcId.AVAX_TESTNET],
    tokenAddress: '0x1290248E01ED2F9f863A9752A8aAD396ef3a1B00',
    superTokenAddress: '0x1290248E01ED2F9f863A9752A8aAD396ef3a1B00',
  },
  [RpcId.BASE]: {
    ...ChainData[RpcId.BASE],
    tokenAddress: '0xc0Fbc4967259786C743361a5885ef49380473dCF',
    superTokenAddress: '0xc0Fbc4967259786C743361a5885ef49380473dCF',
  },
  [RpcId.BSC]: {
    ...ChainData[RpcId.BSC],
    tokenAddress: '0x82D2f8E02Afb160Dd5A480a617692e62de9038C4',
  },
}

export function findChainDataByChainId(chainId: number): RpcType | undefined {
  return Object.values(ChainData).find((chain) => hexToDec(chain.chainId) === chainId)
}

export function findChainMetadataByChainId(chainId: number): ChainMetadataType | undefined {
  return Object.values(ChainMetadata).find((chain) => hexToDec(chain.chainId) === chainId)
}

/**
 * Wrapper for JSON RPC Providers (ex: Metamask).
 */
export class JsonRPCWallet extends BaseProviderWallet {
  declare public readonly provider: providers.JsonRpcProvider | providers.Web3Provider
  private signer?: providers.JsonRpcSigner | Wallet
  public address?: string
  private publicKey?: string

  constructor(providerOrWallet: providers.JsonRpcProvider | providers.Web3Provider | Wallet) {
    super()
    if (providerOrWallet instanceof Wallet) {
      this.signer = providerOrWallet
      this.provider = providerOrWallet.provider as providers.JsonRpcProvider
    } else {
      this.provider = providerOrWallet
    }
  }

  public async connect(): Promise<void> {
    try {
      const connected = await this.isConnected()
      if (!this.signer) {
        if (!connected) {
          await this.provider.send('wallet_requestPermissions', [{ eth_accounts: {} }])
        }
        this.signer = this.provider.getSigner()
      } else if (!connected) {
        throw new Error('JsonRpcProvider error')
      }
      this.address = await this.signer.getAddress()
    } catch (err: unknown) {
      throw new Error(`Could not connect to wallet: ${err}`)
    }
  }

  public async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      if (this.signer instanceof Wallet) {
        this.publicKey = this.signer.publicKey
      } else {
        console.warn(RPC_WARNING)
        this.publicKey = await this.provider.send('eth_getEncryptionPublicKey', [this.address])
      }
      if (!this.publicKey || this.publicKey.length === 0) {
        throw new Error('Could not retrieve public key')
      }
    }
    return this.publicKey
  }

  public async signMessage(data: Buffer | string): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected')
    return this.signer.signMessage(data)
  }

  public async getCurrentChainId(): Promise<number> {
    const network = await this.provider.getNetwork()
    return network.chainId
  }

  public isMetamask(): boolean {
    return this.provider instanceof providers.Web3Provider && !!this.provider?.provider.isMetaMask
  }

  public async isConnected(): Promise<boolean> {
    if (this.signer instanceof Wallet) {
      return !!(await this.provider.detectNetwork())
    }

    const accounts = await this.provider.send('eth_accounts', [])
    return accounts.length !== 0
  }

  public async changeNetwork(chainOrRpc: RpcType | RpcId = RpcId.ETH): Promise<void> {
    if (this.signer instanceof Wallet) {
      console.warn('[Switch Network]: Only available for injected providers')
    }

    const chainData = typeof chainOrRpc === 'number' ? ChainData[chainOrRpc] : chainOrRpc

    try {
      await this.provider.send('wallet_switchEthereumChain', [{ chainId: chainData.chainId }])
    } catch (e) {
      const err = e as { code?: number; message?: string }
      if (err?.code === MetamaskErrorCodes.UNRECOGNIZED) {
        await this.addNetwork(chainData)
      } else if (err?.code === MetamaskErrorCodes.REJECTED) {
        console.warn(`[Switch Network]: ${err?.message}`)
      } else {
        throw new Error(`[Switch Network]: ${err?.message}`)
      }
    }
  }

  private async addNetwork(chainData: RpcType): Promise<void> {
    if (this.signer instanceof Wallet) {
      console.warn('[Add Network]: Only available for injected providers')
    }

    try {
      await this.provider.send('wallet_addEthereumChain', [chainData])
      await this.changeNetwork(chainData)
    } catch (e) {
      const err = e as { code?: number; message?: string }
      if (err?.code === MetamaskErrorCodes.REJECTED) {
        console.warn(`[Add Network]: ${err?.message}`)
      } else {
        throw new Error(`[Add Network]: ${err?.message}`)
      }
    }
  }
}
