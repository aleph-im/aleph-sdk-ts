import shajs from 'sha.js';

import {BaseMessage, StorageEngine} from "../message";
import axios from "axios";

type PutConfiguration<T> = {
    message: BaseMessage;
    content: T;
    inlineRequested: boolean;
    storageEngine: StorageEngine;
    APIServer: string;
};

type PushConfiguration<T> = {
    content: T;
    APIServer: string;
    storageEngine: StorageEngine;
}

type PushResponse = {
    hash: string;
}

export async function PutContentToStorageEngine<T>(configuration: PutConfiguration<T>): Promise<void> {
    if (configuration.inlineRequested) {
        const serialized = JSON.stringify(configuration.content);

        if (serialized.length > 150000) {
            configuration.inlineRequested = false;
        } else {
            configuration.message.item_type = "INLINE";
            configuration.message.item_content = serialized;
            configuration.message.item_hash = new shajs.sha256().update(serialized).digest("hex");
        }
    }
    if (!configuration.inlineRequested) {
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
        `${configuration.APIServer}/api/v0/${configuration.storageEngine.toLowerCase()}/add_json`,
        configuration.content,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    return response.data.hash;
}
