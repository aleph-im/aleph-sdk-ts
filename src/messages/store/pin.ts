import * as base from "../../accounts/account";
import { ItemType, StoreMessage } from "../types";
import { Publish } from "./publish";
import { DEFAULT_API_V2 } from "../../global";

/**
 * channel:         The channel in which the message will be published.
 *
 * account:         The account used to sign the aggregate message.
 *
 * fileHash:        The IPFS hash of the content you want to pin.
 *
 * storageEngine:   [Deprecated] - The storage engine to used when storing the message.
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
type StorePinConfiguration = {
    channel: string;
    account: base.Account;
    fileHash: string;
    storageEngine?: ItemType;
    APIServer?: string;
};

/**
 * Publishes a store message, containing a hash to pin an IPFS file.
 * You also have to provide default message properties, such as the targeted channel or the account used to sign the message.
 *
 * @param spc The configuration used to pin the file.
 */
export async function Pin(spc: StorePinConfiguration): Promise<StoreMessage> {
    if (spc.storageEngine) console.warn("storageEngine param is deprecated and will be removed soon for pinning");

    return await Publish({
        account: spc.account,
        channel: spc.channel,
        fileHash: spc.fileHash,
        APIServer: spc.APIServer || DEFAULT_API_V2,
        storageEngine: ItemType.ipfs,
    });
}
