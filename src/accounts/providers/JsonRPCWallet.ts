import { ethers } from "ethers";
import { BaseProviderWallet } from "./BaseProviderWallet";

const RPC_WARNING = `DEPRECATION WARNING: 
Encryption/Decryption features may become obsolete, for more information: https://github.com/aleph-im/aleph-sdk-ts/issues/37`;

export enum RpcChainType {
    ETH,
    AVAX,
}

const ChainData = {
    [RpcChainType.AVAX]: {
        chainId: "0xA86A",
        rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
        chainName: "Avalanche Mainnet",
        nativeCurrency: {
            name: "AVAX",
            symbol: "AVAX",
            decimals: 18,
        },
        blockExplorerUrls: ["https://snowtrace.io"],
    },
    [RpcChainType.ETH]: {
        chainId: "0x1",
        rpcUrls: ["https://mainnet.infura.io/v3/"],
        chainName: "Ethereum Mainnet",
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
        },
        blockExplorerUrls: ["https://etherscan.io"],
    },
};

/**
 * Wrapper for JSON RPC Providers (ex: Metamask)
 */
export class JsonRPCWallet extends BaseProviderWallet {
    private provider: ethers.providers.Web3Provider;
    private signer?: ethers.providers.JsonRpcSigner;
    public address?: string;
    private publicKey?: string;

    constructor(provider: ethers.providers.Web3Provider) {
        super();
        this.provider = provider;
    }

    public async connect(): Promise<void> {
        try {
            await this.provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
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

    public async decrypt(data: Buffer): Promise<string> {
        console.warn(RPC_WARNING);
        const query = await this.provider.send("eth_decrypt", [data, this.address]);

        if (query.length > 0) return query;
        throw new Error("Could not decrypt data");
    }

    public async signMessage(data: Buffer | string): Promise<string> {
        if (!this.signer) throw new Error("Wallet not connected");
        return this.signer.signMessage(data);
    }

    public async changeNetwork(chain: RpcChainType = RpcChainType.ETH): Promise<void> {
        if (chain === RpcChainType.ETH) {
            await this.provider.send("wallet_switchEthereumChain", [{ chainId: "0x1" }]);
        } else await this.provider.send("wallet_addEthereumChain", [ChainData[chain]]);
    }
}
