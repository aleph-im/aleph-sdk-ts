import { Account } from "../../accounts/account";
import { ChainRef, ItemType, MessageType, PostContent, PostMessage } from "../types";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";

/**
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * ref:             A hash or message object to reference another post / transaction hash / address / ...
 *
 * channel:         The channel in which the message will be published.
 *
 * inlineRequested: [Deprecated, use storageEngine instead] - Will the message be inlined ?
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * account:         The account used to sign the aggregate message.
 *
 * address:         To aggregate content for another account (Required an authorization key)
 *
 * postType:        string of your choice like Blog / amend / chat / comment / ...
 *
 * content:         The post message content.
 */
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
