import { ChainType } from "../accounts/account";

type MongoDBID = {
    $oid: string;
};

type MessageConfirmationHash = {
    binary: string;
    type: string;
};

type MessageConfirmation = {
    chain: string;
    height: number;
    hash: string | MessageConfirmationHash;
};

export enum StorageEngine {
    IPFS = "IPFS",
    STORAGE = "STORAGE",
}

export enum MessageType {
    Aggregate = "AGGREGATE",
    Post = "POST",
    Store = "STORE",
}

export type BaseContent = {
    address: string;
    time: number;
};

export type BaseMessage = {
    _id?: MongoDBID;
    chain: ChainType;
    sender: string;
    type: MessageType;
    channel: string;
    confirmations?: MessageConfirmation[];
    confirmed: boolean;
    signature: string;
    size: number;
    time: number;
    item_type: StorageEngine | "INLINE";
    item_content: string;
    hash_type?: string;
    item_hash: string;
    content?: BaseContent;
};

/**
 * Extracts some fields from an Aleph message to sign it using an account.
 *
 * @param message The message used to extract data.
 */
export function GetVerificationBuffer(message: BaseMessage): Buffer {
    return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`);
}
