import * as base from "../../accounts/account";
import { Account } from "../../accounts/account";
import { BaseMessage, ItemType, MessageType, StoreContent, StoreMessage } from "../types";
import { PushFileToStorageEngine, PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { RequireOnlyOne } from "../../utils/requiredOnlyOne";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";
import shajs from "sha.js";
import { stripTrailingSlash } from "../../utils/url";
import FormData from "form-data";
import axios from "axios";

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
    account: base.Account;
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

    const myHash = await getHash(fileObject, storageEngine, fileHash, APIServer);

    const message = await createAndSendStoreMessage(
        account,
        channel,
        myHash,
        storageEngine,
        APIServer,
        inlineRequested,
        sync,
        fileObject,
    );

    return message;
}

async function getHash(
    fileObject: Buffer | Blob | null | undefined,
    storageEngine: ItemType,
    fileHash: string | undefined,
    APIServer: string,
) {
    if (fileObject && storageEngine !== ItemType.ipfs) {
        const hash = await processFileObject(fileObject);
        if (hash == null) {
            throw new Error("Cannot process file");
        }
        return hash;
    } else if (fileObject && storageEngine === ItemType.ipfs) {
        return await PushFileToStorageEngine({
            APIServer,
            storageEngine,
            file: fileObject,
        });
    } else if (fileHash) {
        return fileHash;
    } else {
        throw new Error("Error with File Hash");
    }
}

async function createAndSendStoreMessage(
    account: base.Account,
    channel: string,
    myHash: string,
    storageEngine: ItemType,
    APIServer: string,
    inlineRequested: boolean,
    sync: boolean,
    fileObject: Buffer | Blob | undefined,
) {
    const timestamp = Date.now() / 1000;
    const storeContent: StoreContent = {
        address: account.address,
        item_type: storageEngine,
        item_hash: myHash,
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

    if (ItemType.ipfs == message.item_type) {
        await SignAndBroadcast({
            message: message,
            account,
            APIServer,
        });
    } else if (!fileObject) {
        throw new Error("You need to specify a File to upload or a Hash to pin.");
    } else {
        return await sendMessage(
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

async function processFileObject(fileObject: Blob | Buffer | null): Promise<string> {
    if (!fileObject) throw new Error("fileObject is null");

    if (fileObject instanceof Blob) {
        fileObject = await blobToBuffer(fileObject);
    }
    return calculateSHA256Hash(fileObject);
}

type SignAndBroadcastConfiguration = {
    message: BaseMessage;
    account: Account;
    APIServer: string;
    sync: boolean;
};

async function sendMessage(configuration: SignAndBroadcastConfiguration, fileObject: Blob | Buffer) {
    const form = new FormData();
    const metadata = {
        message: {
            ...configuration.message,
            signature: await configuration.account.Sign(configuration.message),
        },
        sync: configuration.sync,
    };

    form.append("file", fileObject);
    form.append("metadata", JSON.stringify(metadata));

    const response = await axios.post(`${stripTrailingSlash(configuration.APIServer)}/api/v0/storage/add_file`, form, {
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

async function blobToBuffer(blob: Blob): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(Buffer.from(reader.result));
            } else {
                reject("Failed to convert Blob to Buffer.");
            }
        };
        reader.readAsArrayBuffer(blob);
    });
}

function calculateSHA256Hash(data: ArrayBuffer | Buffer): string {
    const buffer = Buffer.from(data);
    return new shajs.sha256().update(buffer).digest("hex");
}
