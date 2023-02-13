import axios from "axios";
import { DEFAULT_API_V2 } from "../../global";
import { getSocketPath, stripTrailingSlash } from "../../utils/url";
import { BaseMessage, Chain, MessageType } from "../message";

type MessageQueryResponse = {
    messages: BaseMessage[];
    pagination_page: number;
    pagination_total: number;
    pagination_per_page: number;
    pagination_item: string;
};

type GetMessagesConfiguration = {
    pagination?: number;
    page?: number;
    addresses?: string[];
    channels?: string[];
    chains?: Chain[];
    refs?: string[];
    tags?: string[];
    contentTypes?: string[];
    contentKeys?: string[];
    hashes?: string[];
    messageType?: MessageType;
    startDate?: Date;
    endDate?: Date;
    APIServer?: string;
};

type GetMessagesParams = {
    pagination?: number;
    page?: number;
    addresses?: string;
    channels?: string;
    chains?: string;
    refs?: string;
    tags?: string;
    contentTypes?: string;
    contentKeys?: string;
    hashes?: string;
    msgType?: string;
    startDate?: number;
    endDate?: number;
};

/**
 * Retrieves Messages with query params.
 *
 * @param configuration The message params to make the query.
 */
export async function GetMessages({
    pagination = 20,
    page = 1,
    addresses = [],
    channels = [],
    chains = [],
    refs = [],
    tags = [],
    contentTypes = [],
    contentKeys = [],
    hashes = [],
    messageType,
    startDate,
    endDate,
    APIServer = DEFAULT_API_V2,
}: GetMessagesConfiguration): Promise<MessageQueryResponse> {
    const params: GetMessagesParams = {
        pagination,
        page,
        addresses: addresses.join(",") || undefined,
        channels: channels.join(",") || undefined,
        chains: chains.join(",") || undefined,
        refs: refs.join(",") || undefined,
        tags: tags.join(",") || undefined,
        contentTypes: contentTypes.join(",") || undefined,
        contentKeys: contentKeys.join(",") || undefined,
        hashes: hashes.join(",") || undefined,
        msgType: messageType || undefined,
        startDate: startDate ? startDate.valueOf() / 1000 : undefined,
        endDate: endDate ? endDate.valueOf() / 1000 : undefined,
    };

    const response = await axios.get<MessageQueryResponse>(`${stripTrailingSlash(APIServer)}/api/v0/messages.json`, {
        params,
        socketPath: getSocketPath(),
    });

    if (response.data.messages.length > 0) return response.data;
    throw new Error(`No messages found`);
}
