import { SignableMessage } from '@aleph-sdk/account'
import { char2Bytes, verifySignature } from '@taquito/utils'

/**
 * Provide a way to verify the authenticity of a signature associated with a given message.
 * This method rely on the verifySignature() implementation from taquito/utils.
 *
 * @param message The content of the signature to verify. It needs to be a BaseMessage object.
 * @param signature The signature associated with the first params of this method.
 */
export function verifyTezos(message: SignableMessage, signature: string): boolean {
  const buffer = message.getVerificationBuffer()

  const { signature: parsedSignature, publicKey, dAppUrl } = JSON.parse(signature)
  const ISO8601formattedTimestamp = new Date(message.time).toISOString()
  const formattedInput: string = ['Tezos Signed Message:', dAppUrl, ISO8601formattedTimestamp, buffer.toString()].join(
    ' ',
  )
  const bytes = char2Bytes(formattedInput)
  const payloadBytes = '05' + '0100' + char2Bytes(String(bytes.length)) + bytes

  return verifySignature(payloadBytes, publicKey, parsedSignature)
}
