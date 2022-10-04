import axios from "axios";
import { utils } from "@aleph-sdk-ts/core-base";

type PostGetConfiguration = {
    types: string | string[];
    APIServer: string;
    pagination: number;
    page: number;
    refs: string[];
    addresses: string[];
    tags: string[];
    hashes: string[];
};

type PostQueryParams = {
    types: string | string[];
    pagination: number;
    page: number;
    refs?: string;
    addresses?: string;
    tags?: string;
    hashes?: string;
};

type PostResponse<T> = {
    _id: {
        $oid: string;
    };
    chain: string;
    item_hash: string;
    sender: string;
    type: string;
    channel: string;
    confirmed: boolean;
    content: T;
    item_content: string;
    item_type: string;
    signature: string;
    size: number;
    time: number;
    original_item_hash: string;
    original_signature: string;
    original_type: string;
    hash: string;
    address: string;
};

type PostQueryResponse<T> = {
    posts: PostResponse<T>[];
    pagination_page: number;
    pagination_total: number;
    pagination_per_page: number;
    pagination_item: string;
};

/**
 * Retrieves a post message on from the Aleph network.
 * It uses the type(s) provided in the configuration given as a parameter to retrieve the wanted message.
 * It also uses the pagination and page parameter to limit the number of messages to retrieve.
 *
 * @param configuration The configuration used to get the message, including the API endpoint.
 */
export async function Get<T>(configuration: PostGetConfiguration): Promise<PostQueryResponse<T>> {
    const params: PostQueryParams = {
        types: configuration.types,
        pagination: configuration.pagination,
        page: configuration.page,
    };

    if (configuration.refs?.length > 0) {
        params.refs = configuration.refs.join(",");
    }
    if (configuration.addresses?.length > 0) {
        params.addresses = configuration.addresses.join(",");
    }
    if (configuration.tags?.length > 0) {
        params.tags = configuration.tags.join(",");
    }
    if (configuration.hashes?.length > 0) {
        params.hashes = configuration.hashes.join(",");
    }

    const response = await axios.get<PostQueryResponse<T>>(
        `${utils.url.stripTrailingSlash(configuration.APIServer)}/api/v0/posts.json`,
        {
            params,
            socketPath: utils.url.getSocketPath(),
        },
    );
    return response.data;
}
