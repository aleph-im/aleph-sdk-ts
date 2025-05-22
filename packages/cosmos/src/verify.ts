import { SignableMessage } from '@aleph-sdk/account'
import elliptic from 'elliptic'

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the ethers.utils.verifyMessage() implementation.
 *
 * @param message The content of the signature to verify. It can be the result of GetVerificationBuffer() or directly a BaseMessage object.
 * @param serializedSignature The signature associated with the first params of this method.
 */
export async function verifyCosmos(
  message: Uint8Array | SignableMessage,
  serializedSignature: string,
): Promise<boolean> {
  if (!(message instanceof Uint8Array)) {
    if (typeof message?.getVerificationBuffer === 'function') {
      message = message.getVerificationBuffer()
    } else {
      throw Error(`Cannot sign message: ${message}`)
    }
  }

  const { signature, pub_key } = JSON.parse(serializedSignature)
  if (!signature || !pub_key) return false

  // unsupported curve checking
  if (pub_key?.type !== 'tendermint/PubKeySecp256k1') return false

  // Decode the Base64-encoded signature
  const publicKey = Buffer.from(pub_key.value, 'base64')
  const signatureBuffer = Buffer.from(signature, 'base64')

  // Extract the r and s values from the signature
  const r = signatureBuffer.subarray(0, 32)
  const s = signatureBuffer.subarray(32, 64)

  // Create a signature object with the r and s values
  const signatureObj = { r, s }

  try {
    const secp256k1 = new elliptic.ec('secp256k1')
    const key = secp256k1.keyFromPublic(publicKey)
    return key.verify(message, signatureObj)
  } catch {
    return false
  }
}
