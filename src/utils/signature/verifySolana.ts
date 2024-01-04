import { BaseMessage } from "../../messages/types";
import { GetVerificationBuffer } from "../../messages";
import nacl from "tweetnacl";
import bs58 from "bs58";

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the nacl.sign.detached.verify() implementation.
 *
 * @param message The content of the signature to verify. It can be the result of GetVerificationBuffer() or directly a BaseMessage object.
 * @param serializedSignature The signature associated with the first params of this method.
 */
function verifySolana(message: Buffer | BaseMessage, serializedSignature: string): boolean {
    if (!(message instanceof Buffer)) message = GetVerificationBuffer(message);
    const { signature, publicKey } = JSON.parse(serializedSignature);

    try {
        return nacl.sign.detached.verify(message, bs58.decode(signature), bs58.decode(publicKey));
    } catch (e: unknown) {
        return false;
    }
}

export default verifySolana;
