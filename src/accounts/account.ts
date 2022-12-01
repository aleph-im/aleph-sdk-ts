import { BaseMessage, Chain } from "../messages/message";

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
    readonly publicKey: string;

    protected constructor(address: string, publicKey: string) {
        super(address);
        this.publicKey = publicKey;
    }
    abstract encrypt(content: Buffer, delegateSupport?: string | ECIESAccount): Promise<Buffer>;
}
