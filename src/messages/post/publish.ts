import { Account } from "../../accounts/account";
import { ChainRef, ItemType, MessageType, PostContent, PostMessage } from "../message";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";

type PostSubmitConfiguration<T> = {
    APIServer?: string;
    ref?: string | ChainRef;
    channel: string;
    inlineRequested?: boolean;
    storageEngine?: ItemType;
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
export async function Publish<T>({
    account,
    postType,
    content,
    inlineRequested,
    channel,
    ref,
    address,
    storageEngine = ItemType.inline,
    APIServer = DEFAULT_API_V2,
}: PostSubmitConfiguration<T>): Promise<PostMessage<T>> {
    if (inlineRequested) console.warn("Inline requested is deprecated and will be removed: use storageEngine.inline");

    const timestamp: number = Date.now() / 1000;
    const postContent: PostContent<T> = {
        type: postType,
        address: address || account.address,
        content: content,
        time: timestamp,
    };

    if (ref !== "") postContent.ref = ref;

    const message = MessageBuilder<PostContent<T>, MessageType.post>({
        account,
        channel,
        timestamp,
        storageEngine,
        content: postContent,
        type: MessageType.post,
    });

    await PutContentToStorageEngine({
        message: message,
        content: postContent,
        APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account,
        APIServer,
    });

    return message;
}
