import { BaseMessage, Chain } from "../messages/message";

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

    abstract GetChain(): Chain;
    abstract Sign(message: BaseMessage): Promise<string>;
}
