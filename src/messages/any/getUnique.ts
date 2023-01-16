import { DEFAULT_API_V2 } from "../../global";
import { BaseMessage, MessageType } from "../message";
import { Get } from "./get";

type GetUniqueParams = {
    hashes: string[];
    channels?: string[];
    messageType?: MessageType;
    APIServer?: string;
};

type GetUniqueConfiguration = {
    hash: string;
    channel?: string;
    messageType?: MessageType;
    APIServer?: string;
};

//TODO: Provide websocket binding (Refacto Get into GetQuerryBuilder)

/**
 * Retrieves a specific Message with query params.
 *
 * @param configuration The message params to make the query.
 */
export async function GetUnique<T = BaseMessage>({
    hash,
    channel,
    messageType,
    APIServer = DEFAULT_API_V2,
}: GetUniqueConfiguration): Promise<T> {
    const params: GetUniqueParams = {
        hashes: [hash],
        channels: channel ? [channel] : undefined,
        messageType,
        APIServer,
    };

    try {
        const response = await Get(params);
        return response.messages[0] as unknown as T;
    } catch {
        throw new Error(`No messages found for: ${hash}`);
    }
}
