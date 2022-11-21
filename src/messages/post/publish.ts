import { Account } from "../../accounts/account";
import { MessageType, ItemType, PostContent, PostMessage, ChainRef } from "../message";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";

type PostSubmitConfiguration<T> = {
    APIServer: string;
    ref?: string | ChainRef;
    channel: string;
    inlineRequested: boolean;
    storageEngine: ItemType;
    account: Account;
    address?: string;
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
export async function Publish<T>(configuration: PostSubmitConfiguration<T>): Promise<PostMessage<T>> {
    const timestamp: number = Date.now() / 1000;
    const content: PostContent<T> = {
        type: configuration.postType,
        address: configuration.address || configuration.account.address,
        content: configuration.content,
        time: timestamp,
    };

    if (configuration.ref !== "") {
        content.ref = configuration.ref;
    }

    const message: PostMessage<T> = {
        chain: configuration.account.GetChain(),
        sender: configuration.account.address,
        type: MessageType.post,
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
