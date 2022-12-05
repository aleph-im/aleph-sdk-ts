import * as base from "../../accounts/account";
import { ItemType, MessageType, StoreContent, StoreMessage } from "../message";
import { PushFileToStorageEngine, PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";

type StorePublishConfiguration = {
    channel: string;
    account: base.Account;
    fileObject?: Buffer | Blob;
    fileHash?: string;
    storageEngine: ItemType;
    APIServer: string;
};

/**
 * Publishes a store message, containing a File.
 * You also have to provide default message properties, such as the targeted channel or the account used to sign the message.
 *
 * @param spc The configuration used to publish a store message.
 */
export async function Publish(spc: StorePublishConfiguration): Promise<StoreMessage> {
    if (!spc.fileObject && !spc.fileHash) throw new Error("You need to specify a File to upload or a Hash to pin.");
    if (spc.fileObject && spc.fileHash) throw new Error("You can't pin a file and upload it at the same time.");
    if (spc.fileHash && spc.storageEngine !== ItemType.ipfs) throw new Error("You must choose ipfs to pin file.");

    const hash =
        spc.fileHash ||
        (await PushFileToStorageEngine({
            APIServer: spc.APIServer,
            storageEngine: spc.storageEngine,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            file: spc.fileObject,
        }));

    const timestamp = Date.now() / 1000;
    const content: StoreContent = {
        address: spc.account.address,
        item_type: spc.storageEngine,
        item_hash: hash,
        time: timestamp,
    };

    const message: StoreMessage = {
        signature: "",
        chain: spc.account.GetChain(),
        sender: spc.account.address,
        type: MessageType.store,
        channel: spc.channel,
        confirmed: false,
        time: timestamp,
        size: 0,
        item_type: spc.storageEngine,
        item_content: "",
        item_hash: "",
        content: content,
    };

    await PutContentToStorageEngine({
        message: message,
        content: content,
        inlineRequested: true,
        storageEngine: spc.storageEngine,
        APIServer: spc.APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account: spc.account,
        APIServer: spc.APIServer,
    });

    return message;
}
