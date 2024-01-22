import { ethers } from "ethers";

const RPC_WARNING = `DEPRECATION WARNING: 
Encryption/Decryption features may become obsolete, for more information: https://github.com/aleph-im/aleph-sdk-ts/issues/37`;

export enum RpcId {
    ETH,
    ETH_FLASHBOTS,
    POLYGON,
    BSC,
    AVAX,
    AVAX_TESTNET,
}

export type RpcType = {
    chainId: string;
    rpcUrls: string[];
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrls: string[];
};

export type ChangeRpcParam = RpcType | RpcId;

export function decToHex(dec: number): string {
    return "0x" + dec.toString(16);
}

export function hexToDec(hex: string): number {
    return parseInt(hex.slice(2), 16);
}

export const ChainData: { [key: number]: RpcType } = {
    [RpcId.AVAX]: {
        chainId: decToHex(43114),
        rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
        chainName: "Avalanche Mainnet",
        nativeCurrency: {
            name: "AVAX",
            symbol: "AVAX",
            decimals: 18,
        },
        blockExplorerUrls: ["https://snowtrace.io/"],
    },
    [RpcId.AVAX_TESTNET]: {
        chainId: decToHex(43113),
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
        chainName: "Avalanche Testnet",
        nativeCurrency: {
            name: "AVAX",
            symbol: "AVAX",
            decimals: 18,
        },
        blockExplorerUrls: ["https://testnet.snowtrace.io/"],
    },
    [RpcId.ETH]: {
        chainId: decToHex(1),
        rpcUrls: ["https://mainnet.infura.io/v3/"],
        chainName: "Ethereum Mainnet",
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrls: ["https://etherscan.io"],
    },
    [RpcId.ETH_FLASHBOTS]: {
        chainId: decToHex(1),
        rpcUrls: ["https://rpc.flashbots.net/"],
        chainName: "Ethereum Mainnet - Flashbots",
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrls: ["https://etherscan.io"],
    },
    [RpcId.POLYGON]: {
        chainId: decToHex(137),
        rpcUrls: ["https://polygon-rpc.com/"],
        chainName: "Polygon Mainnet",
        nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18,
        },
        blockExplorerUrls: ["https://polygonscan.com/"],
    },
    [RpcId.BSC]: {
        chainId: decToHex(56),
        rpcUrls: ["https://bsc-dataseed.binance.org/"],
        chainName: "Binance Smart Chain Mainnet",
        nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18,
        },
        blockExplorerUrls: ["https://bscscan.com"],
    },
};

export async function getRpcId({ chainId, rpcUrl }: { chainId?: number; rpcUrl?: string }): Promise<RpcId> {
    if (!chainId && !rpcUrl) throw new Error("No chainId or rpcUrl provided");
    for (const [rpcChainType, chainData] of Object.entries(ChainData)) {
        if (rpcUrl) if (!chainData.rpcUrls.includes(rpcUrl)) continue;
        if (chainId) if (chainData.chainId !== decToHex(chainId)) continue;
        return parseInt(rpcChainType);
    }
    throw new Error("ChainId and/or rpcUrl not found in preset chains");
}

/**
 * Wrapper for JSON RPC Providers (ex: Metamask).
 */
export class JsonRPCWallet {
    public readonly provider: ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider;
    private signer?: ethers.providers.JsonRpcSigner;
    public address?: string;
    private publicKey?: string;

    constructor(provider: ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider) {
        this.provider = provider;
    }

    public async connect(): Promise<void> {
        try {
            const connected = await this.isConnected();
            if (!connected) {
                await this.provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
            }
            this.signer = this.provider.getSigner();
            this.address = await this.signer.getAddress();
        } catch (err: unknown) {
            throw new Error("Could not get Wallet permissions");
        }
    }

    public async getPublicKey(): Promise<string> {
        if (!this.publicKey) {
            console.warn(RPC_WARNING);
            this.publicKey = await this.provider.send("eth_getEncryptionPublicKey", [this.address]);
            if (!this.publicKey || this.publicKey.length === 0) {
                throw new Error("Could not retrieve public key");
            }
        }
        return this.publicKey;
    }

    public async decrypt(data: Buffer | string): Promise<string> {
        console.warn(RPC_WARNING);
        const query = await this.provider.send("eth_decrypt", [data, this.address]);

        if (query.length > 0) return query;
        throw new Error("Could not decrypt data");
    }

    public async signMessage(data: Buffer | string): Promise<string> {
        if (!this.signer) throw new Error("Wallet not connected");
        return this.signer.signMessage(data);
    }

    public async changeNetwork(chainOrRpc: RpcType | RpcId = RpcId.ETH): Promise<void> {
        if (typeof chainOrRpc === "number") {
            if (chainOrRpc === RpcId.ETH) {
                await this.provider.send("wallet_switchEthereumChain", [{ chainId: "0x1" }]);
            } else await this.provider.send("wallet_addEthereumChain", [ChainData[chainOrRpc]]);
        } else {
            await this.provider.send("wallet_addEthereumChain", [chainOrRpc]);
        }
    }

    public async getCurrentChainId(): Promise<number> {
        const network = await this.provider.getNetwork();
        return network.chainId;
    }

    public isMetamask(): boolean {
        return this.provider instanceof ethers.providers.Web3Provider && !!this.provider?.provider.isMetaMask;
    }

    public async isConnected(): Promise<boolean> {
        const accounts = await this.provider.send("eth_accounts", []);
        return accounts.length !== 0;
    }
}
