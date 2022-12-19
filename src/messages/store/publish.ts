import * as base from "../../accounts/account";
import { ItemType, MessageType, StoreContent, StoreMessage } from "../message";
import { PushFileToStorageEngine, PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { RequireOnlyOne } from "../../utils/requiredOnlyOne";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";

type StorePublishConfiguration = {
    channel: string;
    account: base.Account;
    fileObject?: Buffer | Blob;
    fileHash?: string;
    storageEngine?: ItemType;
    APIServer?: string;
};

/**
 * Publishes a store message, containing a File.
 * You also have to provide default message properties, such as the targeted channel or the account used to sign the message.
 *
 * @param spc The configuration used to publish a store message.
 */
export async function Publish({
    account,
    APIServer = DEFAULT_API_V2,
    storageEngine = ItemType.storage,
    channel,
    fileHash,
    fileObject,
}: RequireOnlyOne<StorePublishConfiguration, "fileObject" | "fileHash">): Promise<StoreMessage> {
    if (!fileObject && !fileHash) throw new Error("You need to specify a File to upload or a Hash to pin.");
    if (fileObject && fileHash) throw new Error("You can't pin a file and upload it at the same time.");
    if (fileHash && storageEngine !== ItemType.ipfs) throw new Error("You must choose ipfs to pin file.");

    const hash =
        fileHash ||
        (await PushFileToStorageEngine({
            APIServer,
            storageEngine,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            file: fileObject,
        }));

    const timestamp = Date.now() / 1000;
    const storeContent: StoreContent = {
        address: account.address,
        item_type: storageEngine,
        item_hash: hash,
        time: timestamp,
    };

    const message = MessageBuilder<StoreContent, MessageType.store>({
        account,
        channel,
        timestamp,
        storageEngine,
        content: storeContent,
        type: MessageType.store,
    });

    await PutContentToStorageEngine({
        message: message,
        content: storeContent,
        inlineRequested: true,
        storageEngine,
        APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account,
        APIServer,
    });

    return message;
}
