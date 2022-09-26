import shajs from "sha.js";

import { BaseMessage, ItemType } from "../message";
import axios from "axios";
import FormDataNode from "form-data";
import { getSocketPath, stripTrailingSlash } from "../../utils/url";

/**
 * message:         The message to update and then publish.
 *
 * content:         The message's content to put in the message.
 *
 * inlineRequested: Will the message be inlined ?
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS or Aleph).
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
type PutConfiguration<T> = {
    message: BaseMessage;
    content: T;
    inlineRequested: boolean;
    storageEngine: ItemType;
    APIServer: string;
};

type PushConfiguration<T> = {
    content: T;
    APIServer: string;
    storageEngine: ItemType;
};

type PushResponse = {
    hash: string;
};

type PushFileConfiguration = {
    file: Buffer | Blob;
    APIServer: string;
    storageEngine: ItemType;
};

/**
 * This function is used to update the Aleph message's fields and then publish it to the targeted storage engine.
 *
 * @param configuration The configuration used to update & publish the message.
 */
export async function PutContentToStorageEngine<T>(configuration: PutConfiguration<T>): Promise<void> {
    if (configuration.inlineRequested) {
        const serialized = JSON.stringify(configuration.content);

        if (serialized.length > 150000) {
            configuration.inlineRequested = false;
        } else {
            configuration.message.item_type = ItemType.inline;
            configuration.message.item_content = serialized;
            configuration.message.item_hash = new shajs.sha256().update(serialized).digest("hex");
        }
    }
    if (!configuration.inlineRequested) {
        configuration.message.item_content = undefined;

        configuration.message.item_type = configuration.storageEngine;
        configuration.message.item_hash = await PushToStorageEngine<T>({
            content: configuration.content,
            APIServer: configuration.APIServer,
            storageEngine: configuration.storageEngine,
        });
    }
}

async function PushToStorageEngine<T>(configuration: PushConfiguration<T>): Promise<string> {
    const response = await axios.post<PushResponse>(
        `${stripTrailingSlash(configuration.APIServer)}/api/v0/${configuration.storageEngine.toLowerCase()}/add_json`,
        configuration.content,
        {
            headers: {
                "Content-Type": "application/json",
            },
            socketPath: getSocketPath(),
        },
    );
    return response.data.hash;
}

export async function PushFileToStorageEngine(configuration: PushFileConfiguration): Promise<string> {
    const isBrowser = typeof FormData !== "undefined";
    let form: FormDataNode | FormData;

    if (isBrowser) {
        form = new FormData();
        form.append("file", new Blob([configuration.file]));
    } else {
        form = new FormDataNode();
        form.append("file", configuration.file, "File");
    }
    const response = await axios.post<PushResponse>(
        `${stripTrailingSlash(configuration.APIServer)}/api/v0/${configuration.storageEngine.toLowerCase()}/add_file`,
        form,
        {
            headers: {
                "Content-Type": isBrowser
                    ? undefined
                    : `multipart/form-data; boundary=${(form as FormDataNode).getBoundary()}`,
            },
            socketPath: getSocketPath(),
        },
    );
    return response.data.hash;
}
