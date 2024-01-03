import { BaseMessage } from "../../messages/types";
import { GetVerificationBuffer } from "../../messages";
import { char2Bytes, verifySignature } from "@taquito/utils";

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the verifySignature() implementation from taquito/utils.
 *
 * @param message The content of the signature to verify. It needs to be a BaseMessage object.
 * @param signature The signature associated with the first params of this method.
 */
function verifTezos(message: BaseMessage, signature: string): boolean {
    const { signature: parsedSignature, publicKey, dAppUrl } = JSON.parse(signature);

    const buffer = GetVerificationBuffer(message);
    const ISO8601formattedTimestamp = new Date(message.time).toISOString();
    const formattedInput: string = [
        "Tezos Signed Message:",
        dAppUrl,
        ISO8601formattedTimestamp,
        buffer.toString(),
    ].join(" ");
    const bytes = char2Bytes(formattedInput);
    const payloadBytes = "05" + "0100" + char2Bytes(String(bytes.length)) + bytes;

    return verifySignature(payloadBytes, publicKey, parsedSignature);
}

export { verifTezos };
