import axios from "axios";

type StoreGetConfiguration = {
    fileHash: string;
    APIServer: string;
}

export async function Get(configuration: StoreGetConfiguration) {
    const response = await axios.get<ArrayBuffer>(
        `${configuration.APIServer}/api/v0/storage/raw/${configuration.fileHash}?find`,
        {
        responseType: 'arraybuffer',
    });

    return response.data;
}
