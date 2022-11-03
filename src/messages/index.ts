import { BaseMessage } from "./message";
import * as aggregate from "./aggregate";
import * as forget from "./forget";
import * as post from "./post";
import * as program from "./program";
import * as store from "./store";

export const messages = { aggregate, forget, post, program, store };

/**
 * Extracts some fields from an Aleph message to sign it using an account.
 *
 * @param message The message used to extract data.
 */
export function GetVerificationBuffer(message: BaseMessage): Buffer {
    return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`);
}
