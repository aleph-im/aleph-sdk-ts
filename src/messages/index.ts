import { BaseMessage } from "./message";

/**
 * Extracts some fields from an Aleph message to sign it using an account.
 *
 * @param message The message used to extract data.
 */
export function GetVerificationBuffer(message: BaseMessage): Buffer {
    return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`);
}
