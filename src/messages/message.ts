/**
 * Chain defines which account was used to publish a message.
 * It is automatically provided when publishing messages.
 *
 * Warning: Avax, CSDK, NEO are currently not supported by the TS sdk.
 */
import { ProgramContent } from "./program/programModel";

export enum Chain {
    DOT = "DOT",
    ETH = "ETH",
    SOL = "SOL",
    NULS = "NULS",
    NULS2 = "NULS2",
    AVAX = "AVAX",
    CSDK = "CSDK",
    NEO = "NEO",
}

/**
 * Supported hash functions
 */
export enum HashType {
    sha256 = "sha256",
}

/**
 * Message types supported by Aleph
 *
 * Warning: Program is currently not supported by the TS sdk.
 */
export enum MessageType {
    post = "POST",
    aggregate = "AGGREGATE",
    store = "STORE",
    program = "PROGRAM",
    forget = "FORGET",
}

export enum ItemType {
    inline = "inline",
    storage = "storage",
    ipfs = "ipfs",
}

type MongoDBID = {
    $oid: string;
};

/**
 * Some POST messages have a 'ref' field referencing other content
 */
export type ChainRef = {
    chain: string;
    channel?: string;
    item_content: string;
    item_hash: string;
    item_type: string;
    sender: string;
    signature: string;
    time: number;
    type: MessageType.post;
};

type MessageConfirmationHash = {
    binary: string;
    type: string;
};

/**
 * Format of the result when a message has been confirmed on a blockchain
 */
type MessageConfirmation = {
    chain: string;
    height: number;
    hash: string | MessageConfirmationHash;
};

export type BaseContent = {
    address: string;
    time: number;
};

export type AggregateContentKey = {
    name: string;
};

export type AggregateContent<T> = BaseContent & {
    key: string | AggregateContentKey;
    content: T;
};
export type PostContent<T> = BaseContent & {
    content?: T;
    type: string;
    ref?: string | ChainRef;
};

export type StoreContent = BaseContent & {
    item_type: string;
    item_hash: string;
    size?: number;
    content_type?: string;
    ref?: string;
};

export type ForgetContent = BaseContent & {
    hashes: string[];
    reason?: string;
};

export type BaseMessage = {
    _id?: MongoDBID;
    chain: Chain;
    sender: string;
    type: MessageType;
    channel: string;
    confirmations?: MessageConfirmation[];
    confirmed: boolean;
    signature: string;
    size: number;
    time: number;
    item_type: ItemType;
    item_content: string;
    hash_type?: HashType;
    item_hash: string;
    content: BaseContent;
};

export type AggregateMessage<T> = BaseMessage & {
    content: AggregateContent<T>;
    type: MessageType.aggregate;
};

export type PostMessage<T> = BaseMessage & {
    content: PostContent<T>;
    type: MessageType.post;
};

export type StoreMessage = BaseMessage & {
    content: StoreContent;
    type: MessageType.store;
};

export type ForgetMessage = BaseMessage & {
    content: ForgetContent;
    type: MessageType.forget;
};

export type ProgramMessage = BaseMessage & {
    content: ProgramContent;
    type: MessageType.program;
};
