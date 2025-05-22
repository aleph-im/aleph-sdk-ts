import { SignableMessage } from '@aleph-sdk/account'
import { ethers } from 'ethers'

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the ethers.utils.verifyMessage() implementation.
 *
 * @param message The content of the signature to verify. It can be the result of GetVerificationBuffer() or directly a BaseMessage object.
 * @param signature The signature associated with the first params of this method.
 * @param signerAddress Optional, The address associated with the signature to verify. The current account address is used by default.
 */
export function verifyEthereum(
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

  try {
    const address = ethers.utils.verifyMessage(message, signature)
    return address === signerAddress
  } catch {
    return false
  }
}
