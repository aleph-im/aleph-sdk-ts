import { SignableMessage } from '@aleph-sdk/account'
import { Avalanche, BinTools, Buffer as AvaBuff } from 'avalanche'
import shajs from 'sha.js'

export function digestMessage(message: Uint8Array): Buffer {
  const msgSize = Buffer.alloc(4)
  msgSize.writeUInt32BE(message.length, 0)
  const msgStr = Buffer.from(message).toString('utf-8')
  const msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, 'utf8')

  return new shajs.sha256().update(msgBuf).digest()
}

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
  const ava = new Avalanche()
  const keyPair = ava.XChain().keyChain().makeKey()

  const bintools = BinTools.getInstance()
  const readableSignature = bintools.cb58Decode(signature)

  const digest = Buffer.from(await digestMessage(message))
  const digestHex = digest.toString('hex')
  const digestBuff = AvaBuff.from(digestHex, 'hex')

  const recovered = keyPair.recover(digestBuff, readableSignature)
  return signerPKey === recovered.toString('hex')
}
