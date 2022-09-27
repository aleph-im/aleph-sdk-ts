import axios from "axios";
import { DEFAULT_API_V2 } from "@aleph-sdk-ts/core-base/dist/utils/constant";
import { getSocketPath, stripTrailingSlash } from "@aleph-sdk-ts/core-base/dist/utils/url";

type AggregateGetResponse<T> = {
    data: T;
};

type AggregateGetConfiguration = {
    APIServer?: string;
    address: string;
    keys?: Array<string>;
};

/**
 * Retrieves an aggregate message on from the Aleph network.
 * It uses the address & key(s) provided in the configuration given as a parameter to retrieve the wanted message.
 *
 * @param configuration The configuration used to get the message, including the API endpoint.
 */
export async function Get<T>(
    { APIServer = DEFAULT_API_V2, address = "", keys = [] }: AggregateGetConfiguration = {
        APIServer: DEFAULT_API_V2,
        address: "",
        keys: [],
    },
): Promise<T> {
    const _keys = keys.length === 0 ? null : keys.join(",");
    const response = await axios.get<AggregateGetResponse<T>>(
        `${stripTrailingSlash(APIServer)}/api/v0/aggregates/${address}.json`,
        {
            socketPath: getSocketPath(),
            params: {
                keys: _keys,
            },
        },
    );

    if (!response.data.data) {
        throw new Error("no aggregate found");
    }
    return response.data.data;
}
