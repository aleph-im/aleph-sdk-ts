import { Account } from "@aleph-sdk-ts/core-base/dist/types/account";
import {
    MessageType,
    ItemType,
    AggregateContentKey,
    AggregateContent,
    AggregateMessage,
} from "@aleph-sdk-ts/core-base/dist/types/messages";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";

/**
 * account:         The account used to sign the aggregate message.
 *
 * key:             The key used to index the aggregate message.
 *
 * content:         The aggregate message content.
 *
 * channel:         The channel in which the message will be published.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS or Aleph).
 *
 * inlineRequested: Will the message be inlined ?
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
type AggregatePublishConfiguration<T> = {
    account: Account;
    key: string | AggregateContentKey;
    content: T;
    channel: string;
    storageEngine: ItemType;
    inlineRequested: boolean;
    APIServer: string;
};

/**
 * Publishes an aggregate message to the Aleph network.
 *
 * The message's content must respect the following format :
 * {
 *     k_1: v_1,
 *     k_2: v_2,
 * }
 *
 * This message must be indexed using a key, you can provide in the configuration.
 *
 * @param configuration The configuration used to publish the aggregate message.
 */
export async function Publish<T>(configuration: AggregatePublishConfiguration<T>): Promise<AggregateMessage<T>> {
    const timestamp = Date.now() / 1000;
    const content: AggregateContent<T> = {
        address: configuration.account.address,
        key: configuration.key,
        time: timestamp,
        content: configuration.content,
    };
    const message: AggregateMessage<T> = {
        chain: configuration.account.GetChain(),
        channel: configuration.channel,
        sender: configuration.account.address,
        type: MessageType.aggregate,
        confirmed: false,
        signature: "",
        size: 0,
        time: timestamp,
        item_type: configuration.storageEngine,
        item_content: "",
        item_hash: "",
        content: content,
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
