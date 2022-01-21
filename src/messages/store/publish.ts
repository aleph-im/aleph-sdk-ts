import * as base from "../../accounts/account";
import { MessageType, ItemType, StoreContent, StoreMessage } from "../message";
import { PushFileToStorageEngine, PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";

type StorePublishConfiguration = {
    channel: string;
    account: base.Account;
    fileObject: Buffer | Blob;
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
    const hash = await PushFileToStorageEngine({
        APIServer: spc.APIServer,
        storageEngine: spc.storageEngine,
        file: spc.fileObject,
    });

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
