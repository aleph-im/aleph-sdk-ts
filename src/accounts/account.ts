import { BaseMessage, Chain } from "../messages/types";
import { ProviderEncryptionLabel } from "./providers/ProviderEncryptionLib";
import { JsonRPCWallet } from "./providers/JsonRPCWallet";
import { ethers } from "ethers";

/**
 * The Account class is used to implement protocols related accounts - Ethereum, Solana, ...
 * It contains the account's address and public key.
 *
 * All inherited classes of account must implement the GetChain and Sign methods.
 */
export abstract class Account {
    readonly address: string;

    protected constructor(address: string) {
        this.address = address;
    }

    abstract GetChain(): Chain;
    abstract Sign(message: BaseMessage): Promise<string>;
}

/**
 * The ECIESAccount class is used to implement protocols using secp256k1's curve.
 * It extends the Account class by exposing an encryption publicKey and method
 *
 * All inherited classes of ECIESAccount must implement the encrypt methods and expose a publicKey.
 */
export abstract class ECIESAccount extends Account {
    public publicKey: string | undefined;

    protected constructor(address: string, publicKey?: string) {
        super(address);
        this.publicKey = publicKey;
    }

    abstract askPubKey(): Promise<void>;
    abstract encrypt(
        content: Buffer,
        delegateSupport?: string | ECIESAccount,
        encryptionMethod?: ProviderEncryptionLabel,
    ): Promise<Buffer | string>;
    abstract decrypt(content: Buffer | string): Promise<Buffer>;
}

export abstract class EVMAccount extends ECIESAccount {
    public wallet?: ethers.Wallet | JsonRPCWallet;

    public async getChainId(): Promise<number> {
        if (this.wallet instanceof JsonRPCWallet) {
            return this.wallet.provider.network.chainId;
        }
        if (this.wallet instanceof ethers.Wallet) {
            return (await this.wallet.provider.getNetwork()).chainId;
        }
        throw new Error("Wallet/Provider not connected");
    }

    public async switchNetwork(chainId: number): Promise<void> {
        if ((await this.getChainId()) === chainId) return;
        if (this.wallet instanceof JsonRPCWallet) {
            await this.wallet.changeNetwork(chainId);
        }
        if (this.wallet instanceof ethers.Wallet) {
            //await this.wallet.provider.send("wallet_switchEthereumChain", [{ chainId: chainId.toString(16) }]);
            throw new Error("Not implemented");
        }
    }
}
