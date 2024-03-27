import { SignableMessage } from '@aleph-sdk/account'
import { signatureVerify } from '@polkadot/util-crypto'

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the signatureVerify() implementation from @polkadot/util-crypto.
 *
 * @param message The content of the signature to verify. It can be the result of GetVerificationBuffer() or directly a BaseMessage object.
 * @param signature The signature associated with the first params of this method.
 * @param signerAddress Optional, The address associated with the signature to verify. The current account address is used by default.
 */
export function verifySubstrate(
  message: Uint8Array | SignableMessage,
  signature: string,
  signerAddress: string,
): boolean {
  if (!(message instanceof Uint8Array)) {
    if (typeof message?.getVerificationBuffer === 'function') {
      message = message.getVerificationBuffer()
    } else {
      throw Error(`Cannot sign message: ${message}`)
    }
  }
  const parsedSignature = JSON.parse(signature)

  try {
    const result = signatureVerify(message, parsedSignature.data, signerAddress)

    return result.isValid
  } catch (e: unknown) {
    return false
  }
}
