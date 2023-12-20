import { Account } from "../../accounts/account";
import { BaseMessage, ItemType, MessageType, StoreContent, StoreMessage } from "../types";
import { PushFileToStorageEngine, PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { RequireOnlyOne } from "../../utils/requiredOnlyOne";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";
import { stripTrailingSlash } from "../../utils/url";
import FormData from "form-data";
import axios from "axios";
import { calculateSHA256Hash } from "./utils";

/**
 * channel:         The channel in which the message will be published.
 *
 * account:         The account used to sign the aggregate message.
 *
 * fileObject:      A Blob or the content of the file you want to upload.
 *
 * fileHash:        The IPFS hash of the content you want to pin.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS or Aleph storage).
 *
 * inlineRequested: If set to False, the Store message will be store on the same storageEngine you picked.
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
type StorePublishConfiguration = {
    channel: string;
    account: Account;
    fileObject?: Buffer | Blob;
    fileHash?: string;
    storageEngine?: ItemType.ipfs | ItemType.storage;
    inlineRequested?: boolean;
    APIServer?: string;
    sync?: boolean;
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
    inlineRequested = true,
    channel,
    fileHash,
    fileObject,
    sync = false,
}: RequireOnlyOne<StorePublishConfiguration, "fileObject" | "fileHash">): Promise<StoreMessage> {
    if (!fileObject && !fileHash) throw new Error("You need to specify a File to upload or a Hash to pin.");
    if (fileObject && fileHash) throw new Error("You can't pin a file and upload it at the same time.");
    if (fileHash && storageEngine !== ItemType.ipfs) throw new Error("You must choose ipfs to pin the file.");

    let hash: string | undefined = fileHash;
    let buffer: Buffer | undefined = undefined;
    if (!hash) {
        buffer = await processFileObject(fileObject);
        hash = await getHash(buffer, storageEngine, fileHash, APIServer);
    }
    const message = await createAndSendStoreMessage(
        account,
        channel,
        hash,
        storageEngine,
        APIServer,
        inlineRequested,
        sync,
        buffer,
    );
    return message;
}

async function getHash(buffer: Buffer, storageEngine: ItemType, fileHash: string | undefined, APIServer: string) {
    if (buffer && storageEngine !== ItemType.ipfs) {
        const hash = calculateSHA256Hash(buffer);
        if (hash === null || hash === undefined) {
            throw new Error("Cannot process file");
        }
        return hash;
    } else if (buffer && storageEngine === ItemType.ipfs) {
        return await PushFileToStorageEngine({
            APIServer,
            storageEngine,
            file: buffer,
        });
    } else if (fileHash) {
        return fileHash;
    } else {
        throw new Error("Error with File Hash");
    }
}

async function createAndSendStoreMessage(
    account: Account,
    channel: string,
    fileHash: string,
    storageEngine: ItemType,
    APIServer: string,
    inlineRequested: boolean,
    sync: boolean,
    fileObject: Buffer | undefined,
) {
    const timestamp = Date.now() / 1000;
    const storeContent: StoreContent = {
        address: account.address,
        item_type: storageEngine,
        item_hash: fileHash,
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
        inline: inlineRequested,
        APIServer,
    });

    if (ItemType.ipfs == message.item_type || inlineRequested) {
        await SignAndBroadcast({
            message: message,
            account,
            APIServer,
        });
    } else if (!fileObject) {
        throw new Error("You need to specify a File to upload or a Hash to pin.");
    } else {
        await sendMessage(
            {
                message: message,
                account,
                APIServer,
                sync,
            },
            fileObject,
        );
    }

    return message;
}

async function processFileObject(fileObject: Blob | Buffer | null | undefined): Promise<Buffer> {
    if (!fileObject) {
        throw new Error("fileObject is null");
    }

    if (fileObject instanceof Buffer) {
        return fileObject;
    }

    const arrayBuf = await fileObject.arrayBuffer();
    return Buffer.from(arrayBuf);
}

type SignAndBroadcastConfiguration = {
    message: BaseMessage;
    account: Account;
    APIServer: string;
    sync: boolean;
};

async function sendMessage(configuration: SignAndBroadcastConfiguration, fileBuffer: Buffer) {
    const form = new FormData();
    const metadata = {
        message: {
            ...configuration.message,
            signature: await configuration.account.Sign(configuration.message),
        },
        sync: configuration.sync,
    };
    form.append("file", fileBuffer);
    form.append("metadata", JSON.stringify(metadata));

    const response = await axios.post(`${stripTrailingSlash(configuration.APIServer)}/api/v0/storage/add_file`, form, {
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}
