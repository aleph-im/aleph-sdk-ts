import axios from "axios";
import { utils } from "@aleph-sdk-ts/core-base";

type StoreGetConfiguration = {
    fileHash: string;
    APIServer: string;
};

/**
 * Retrieves a store message, i.e. a message containing a File.
 *
 * @param configuration The message hash and the API Server endpoint to make the query.
 */
export async function Get(configuration: StoreGetConfiguration): Promise<ArrayBuffer> {
    const response = await axios.get<ArrayBuffer>(
        `${utils.url.stripTrailingSlash(configuration.APIServer)}/api/v0/storage/raw/${configuration.fileHash}?find`,
        {
            responseType: "arraybuffer",
            socketPath: utils.url.getSocketPath(),
        },
    );

    return response.data;
}
