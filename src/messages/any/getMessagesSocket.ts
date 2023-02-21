import { DEFAULT_API_WS_V2 } from "../../global";
import { Chain, HashType, ItemType, MessageType, BaseContent } from "../message";
import { AlephWebSocket } from "./AlephWebSocket";
import { isNode } from "../../utils/env";
import { AlephNodeWebSocket } from "./AlephNodeWebSocket";

export type SocketResponse = {
    _id?: string;
    chain: Chain;
    sender: string;
    type: MessageType;
    channel: string;
    confirmations?: boolean;
    confirmed: boolean;
    signature: string;
    size: number;
    time: number;
    item_type: ItemType;
    item_content?: string;
    hash_type?: HashType;
    item_hash: string;
    content: BaseContent;
};

type GetMessagesSocketConfiguration = {
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

export type GetMessagesSocketParams = {
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

export type AlephSocket = AlephWebSocket | AlephNodeWebSocket;

/**
 * Retrieves all incoming messages by opening a WebSocket.
 * Messages can be filtered with the params.
 *
 * @param configuration The message params to make the query.
 */
export function GetMessagesSocket({
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
    APIServer = DEFAULT_API_WS_V2,
}: GetMessagesSocketConfiguration): AlephSocket {
    const params: GetMessagesSocketParams = {
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

    if (isNode()) return new AlephNodeWebSocket(params, APIServer);
    else return new AlephWebSocket(params, APIServer);
}
