import axios from 'axios';

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
        `${configuration.APIServer}/api/v0/storage/raw/${configuration.fileHash}?find`,
        {
            responseType: 'arraybuffer',
        },
    );

    return response.data;
}
