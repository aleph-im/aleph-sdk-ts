import { Account, ChainType } from '../../accounts/account';
import { BaseContent, BaseMessage, MessageType, StorageEngine } from '../message';
import { PutContentToStorageEngine } from '../create/publish';
import { SignAndBroadcast } from '../create/signature';

type ChainRef = {
    chain: string;
    channel?: string;
    item_content: string;
    item_hash: string;
    item_type: string;
    sender: string;
    signature: string;
    time: number;
    type: string;
};

type PostSubmitConfiguration<T> = {
    APIServer: string;
    ref?: string | ChainRef;
    chain: ChainType;
    channel: string;
    inlineRequested: boolean;
    storageEngine: StorageEngine;
    account: Account;
    postType: string;
    content: T;
};

type PostContent<T> = BaseContent & {
    content?: T;
    type: string;
    ref?: string | ChainRef;
};

export async function Publish<T>(configuration: PostSubmitConfiguration<T>): Promise<BaseMessage> {
    const timestamp: number = Date.now() / 1000;
    const content: PostContent<T> = {
        type: configuration.postType,
        address: configuration.account.address,
        content: configuration.content,
        time: timestamp,
    };

    if (configuration.ref !== '') {
        content.ref = configuration.ref;
    }

    const message: BaseMessage = {
        chain: configuration.chain,
        sender: configuration.account.address,
        type: MessageType.Post,
        channel: configuration.channel,
        confirmed: false,
        signature: '',
        size: 0,
        time: timestamp,
        item_type: configuration.storageEngine,
        item_content: '',
        item_hash: '',
    };

    await PutContentToStorageEngine({
        message: message,
        content: content,
        inlineRequested: configuration.inlineRequested,
        storageEngine: configuration.storageEngine,
        APIServer: configuration.APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account: configuration.account,
        APIServer: configuration.APIServer,
    });

    return message;
}
