export enum KeypairChains {
  Ethereum = 'ETH_KP',
  Avalanche = 'AVAX_KP',
  Base = 'BASE_KP',
  Solana = 'SOL_KP',
  Tezos = 'XTC_KP',
  Cosmos = 'CSDK_KP',
  NULS2 = 'NULS2_KP',
  Polkadot = 'DOT_KP',
}

export enum HardwareChains {
  Ethereum = 'ETH_HW',
}

export enum WalletChains {
  Ethereum = 'ETH',
  Avalanche = 'AVAX',
  Base = 'BASE',
  Solana = 'SOL',
  Substrate = 'DOT',
}

export type isKeypairChain = keyof typeof KeypairChains
