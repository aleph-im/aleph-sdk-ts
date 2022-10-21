import axios from "axios";
import { DEFAULT_API_V2 } from "../../global";
import { getSocketPath, stripTrailingSlash } from "../../utils/url";

type AggregateGetResponse<T> = {
    data: T;
};

type AggregateGetConfiguration = {
    APIServer?: string;
    address: string;
    keys?: Array<string>;
    limit?: number;
};

/**
 * Retrieves an aggregate message on from the Aleph network.
 * It uses the address & key(s) provided in the configuration given as a parameter to retrieve the wanted message.
 *
 * @param configuration The configuration used to get the message, including the API endpoint.
 */
export async function Get<T>(
    { APIServer = DEFAULT_API_V2, address = "", keys = [], limit = 50 }: AggregateGetConfiguration = {
        APIServer: DEFAULT_API_V2,
        address: "",
        keys: [],
        limit: 50,
    },
): Promise<T> {
    const response = await axios.get<AggregateGetResponse<T>>(
        `${stripTrailingSlash(APIServer)}/api/v0/aggregates/${address}.json`,
        {
            socketPath: getSocketPath(),
            params: {
                keys: keys.join(",") || undefined,
                limit,
            },
        },
    );

    if (!response.data.data) {
        throw new Error("no aggregate found");
    }
    return response.data.data;
}
