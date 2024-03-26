import { SignableMessage } from '@aleph-sdk/account'
import { digestMessage, getAddressFromPkey, recover, splitSig } from './utils'

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the Keypair.recover() implementation.
 *
 * @param message The content of the signature to verify. It can be the result of GetVerificationBuffer() or directly a BaseMessage object.
 * @param signature The signature associated with the first params of this method.
 * @param signerPKey Optional, The publicKey associated with the signature to verify. It Needs to be under a hex serialized  string.
 */
export async function verifyAvalanche(
  message: Uint8Array | SignableMessage,
  signature: string,
  signerPKey: string,
): Promise<boolean> {
  if (!(message instanceof Uint8Array)) {
    if (typeof message?.getVerificationBuffer === 'function') {
      message = message.getVerificationBuffer()
    } else {
      throw Error(`Cannot sign message: ${message}`)
    }
  }
  const signatureObj = splitSig(signature)
  const digestBuff = await digestMessage(message)

  const { pubkBuff } = recover(digestBuff, signatureObj)
  const recoveredPkey = '0x'.concat(pubkBuff.toString('hex'))
  return getAddressFromPkey(signerPKey) === getAddressFromPkey(recoveredPkey)
}
