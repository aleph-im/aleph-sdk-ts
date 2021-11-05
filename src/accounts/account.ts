import { BaseMessage } from "../messages/message";

/**
 * ChainType defines which account was used to publish a message.
 * It is automatically provided when publishing messages.
 */
export enum ChainType {
    Ethereum = "ETH",
    Solana = "SOL",
    Substrate = "DOT",
    NULS = "NULS",
    NULS2 = "NULS2",
}

/**
 * The Account class is used to implement protocols related accounts - Ethereum, Solana, ...
 * It contains the account's address and public key.
 *
 * All inherited classes of account must implement the GetChain and Sign methods.
 */
export abstract class Account {
    readonly address: string;
    readonly publicKey: string;

    protected constructor(address: string, publicKey: string) {
        this.address = address;
        this.publicKey = publicKey;
    }

    abstract GetChain(): ChainType;
    abstract Sign(message: BaseMessage): Promise<string>;
}
