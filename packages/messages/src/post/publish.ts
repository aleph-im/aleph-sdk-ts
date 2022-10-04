import { Account } from "@aleph-sdk-ts/core-base/dist/types/account";
import { messageType } from "@aleph-sdk-ts/core-base";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";

type PostSubmitConfiguration<T> = {
    APIServer: string;
    ref?: string | messageType.ChainRef;
    channel: string;
    inlineRequested: boolean;
    storageEngine: messageType.ItemType;
    account: Account;
    postType: string;
    content: T;
};

/**
 * Publishes a post message to the Aleph network.
 *
 * This message must be indexed using a type, you can provide in the configuration.
 *
 * You can amend the message using the type 'amend' and by providing the reference of the message to amend (its hash).
 *
 * @param configuration The configuration used to publish the aggregate message.
 */
export async function Publish<T>(configuration: PostSubmitConfiguration<T>): Promise<messageType.PostMessage<T>> {
    const timestamp: number = Date.now() / 1000;
    const content: messageType.PostContent<T> = {
        type: configuration.postType,
        address: configuration.account.address,
        content: configuration.content,
        time: timestamp,
    };

    if (configuration.ref !== "") {
        content.ref = configuration.ref;
    }

    const message: messageType.PostMessage<T> = {
        chain: configuration.account.GetChain(),
        sender: configuration.account.address,
        type: messageType.MessageType.post,
        channel: configuration.channel,
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
