import axios from "axios";
import { DEFAULT_API_V2 } from "../../global";
import { getSocketPath, stripTrailingSlash } from "../../utils/url";

type GetMessagesConfiguration = {
    hash: string;
    APIServer?: string;
};

type GetMessagesParams = {
    hashes: string;
};

type MessageQueryResponse<T> = {
    messages: T[];
    pagination_page: number;
    pagination_total: number;
    pagination_per_page: number;
    pagination_item: string;
};

/**
 * Retrieves a specific Message by its hash
 *
 * @param configuration The message hash and the API Server endpoint to make the query.
 */
export async function GetMessage<T>({ hash, APIServer = DEFAULT_API_V2 }: GetMessagesConfiguration): Promise<T> {
    const params: GetMessagesParams = {
        hashes: hash,
    };

    const response = await axios.get<MessageQueryResponse<T>>(`${stripTrailingSlash(APIServer)}/api/v0/messages.json`, {
        params,
        socketPath: getSocketPath(),
    });

    if (response.data.messages.length > 0) return response.data.messages[0];
    throw new Error(`The message ${hash} was not found`);
}
