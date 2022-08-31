import { ethers } from "ethers";
import { BaseProviderWallet, ProviderNames } from "./BaseProviderWallet";

const RPC_WARNING = `DEPRECATION WARNING: 
Encryption/Decryption features may become obsolete, for more information: https://github.com/aleph-im/aleph-sdk-ts/issues/37`;

export class Metamask extends BaseProviderWallet {
    private provider: ethers.providers.Web3Provider;
    private signer?: ethers.providers.JsonRpcSigner;
    public address?: string;
    private publicKey?: string;

    constructor(provider: ethers.providers.Web3Provider) {
        super();
        this.provider = provider;
    }

    public async connect() {
        try {
            await this.provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
            this.signer = this.provider.getSigner();
            this.address = await this.signer.getAddress();
        } catch (err: any) {
            throw new Error("Could not get Metamask permissions");
        }
    }

    public getName(): ProviderNames {
        return ProviderNames.METAMASK;
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
}
