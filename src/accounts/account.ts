import {BaseMessage} from "../messages/message";

export enum ChainType {
    Ethereum = "ETH",
}

export abstract class Account {
    readonly address: string;
    readonly publicKey: string;

    protected constructor(address: string, publicKey: string) {
        this.address = address;
        this.publicKey = publicKey;
    }

    abstract GetChain(): ChainType
    abstract Sign(message: BaseMessage): Promise<string>
}
