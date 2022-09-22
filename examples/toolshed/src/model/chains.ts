export enum KeypairChains {
    Avalanche = "AVAX_KP",
    Cosmos = "CSDK_KP",
    Ethereum = "ETH_KP",
    NULS2 = "NULS2_KP",
    Polkadot = "DOT_KP",
    Solana = "SOL_KP",
    Tezos = "XTC_KP",
}

export enum WalletChains {
    Ethereum = "ETH",
    Solana = "SOL",
}

export type isKeypairChain = keyof typeof KeypairChains;
