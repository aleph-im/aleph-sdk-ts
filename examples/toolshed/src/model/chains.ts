export enum KeypairChains {
    Avalanche = "AVAX_KP",
    Cosmos = "CSDK_KP",
    Ethereum = "ETH_KP",
    NULS2 = "NULS2_KP",
    Polkadot = "DOT_KP",
    Solana = "SOL_KP",
    Tezos = "XTC_KP",
}

export enum HardwareChains {
    Ethereum = "ETH_HW",
}

export enum WalletChains {
    Avalanche = "AVAX",
    Ethereum = "ETH",
    Solana = "SOL",
}

export type isKeypairChain = keyof typeof KeypairChains;
