import {Account} from '../../accounts/account';
import {AggregateContent, AggregateKey} from "./types";
import {BaseMessage, MessageType, StorageEngine} from "../message";
import {PutContentToStorageEngine} from "../create/publish";
import {SignAndBroadcast} from "../create/signature";

type AggregatePublishConfiguration<T> = {
    account: Account;
    key: string | AggregateKey;
    content: T;
    channel: string;
    storageEngine: StorageEngine;
    inlineRequested: boolean;
    APIServer: string;
};

export async function Publish<T>(configuration: AggregatePublishConfiguration<T>) {
    const timestamp = Date.now() / 1000;
    const content: AggregateContent<T> = {
        address: configuration.account.address,
        key: configuration.key,
        time: timestamp,
        content: configuration.content,
    };
    const message: BaseMessage = {
        chain: configuration.account.GetChain(),
        channel: configuration.channel,
        sender: configuration.account.address,
        type: MessageType.Aggregate,
        confirmed: false,
        signature: "",
        size: 0,
        time: timestamp,
        item_type: configuration.storageEngine,
        item_content: "",
        item_hash: "",
    };

    await PutContentToStorageEngine({
        message: message,
        content: content,
        inlineRequested: configuration.inlineRequested,
        storageEngine: configuration.storageEngine,
        APIServer: configuration.APIServer,
    })

    await SignAndBroadcast({
        message: message,
        account: configuration.account,
        APIServer: configuration.APIServer,
    });
}
