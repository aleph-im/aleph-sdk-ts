import { SignableMessage } from '@aleph-sdk/account'
import base58 from 'bs58'
import nacl from 'tweetnacl'

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the nacl.sign.detached.verify() implementation.
 *
 * @param message The content of the signature to verify. It can be the result of GetVerificationBuffer() or directly a BaseMessage object.
 * @param serializedSignature The signature associated with the first params of this method.
 */
export function verifySolana(message: Uint8Array | SignableMessage, serializedSignature: string): boolean {
  if (!(message instanceof Uint8Array)) {
    if (typeof message?.getVerificationBuffer === 'function') {
      message = message.getVerificationBuffer()
    } else {
      throw Error(`Cannot sign message: ${message}`)
    }
  }
  const { signature, publicKey } = JSON.parse(serializedSignature)

  try {
    return nacl.sign.detached.verify(message, base58.decode(signature), base58.decode(publicKey))
  } catch (e: unknown) {
    return false
  }
}
