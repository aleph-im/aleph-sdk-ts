import { PutContentToStorageEngine } from "../create/publish";
import { ForgetContent, ForgetMessage, ItemType, MessageType } from "@aleph-sdk-ts/core-base/dist/messages";
import { Account } from "@aleph-sdk-ts/core-base/dist/account";
import { SignAndBroadcast } from "../create/signature";

/**
 * account:         The account used to sign the forget object.
 *
 * channel:         The channel in which the object will be published.
 *
 * storageEngine:   The storage engine to used when storing the object (IPFS or Aleph).
 *
 * inlineRequested: Will the message be inlined ?
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * hashes:          The Hashes of the Aleph's message to forget.
 *
 * reason:          An optional reason to justify this action (default value: "None").
 */
type ForgetPublishConfiguration = {
    account: Account;
    channel: string;
    storageEngine: ItemType;
    inlineRequested: boolean;
    APIServer: string;
    hashes: string[];
    reason?: string;
};

/**
 * Submit a forget object to remove content from a Post message on the network.
 *
 * Account submitting the forget message. Should either be:
 * The sender of the original message to forget.
 * the sender of the VM that created the message.
 * The address the original message was attributed to.
 *
 * @param configuration The configuration used to publish the forget message.
 */
export async function Publish(configuration: ForgetPublishConfiguration): Promise<ForgetMessage> {
    const timestamp = Date.now() / 1000;
    const content: ForgetContent = {
        address: configuration.account.address,
        time: timestamp,
        hashes: configuration.hashes,
        reason: configuration.reason ? configuration.reason : "None",
    };

    const message: ForgetMessage = {
        chain: configuration.account.GetChain(),
        sender: configuration.account.address,
        type: MessageType.forget,
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
