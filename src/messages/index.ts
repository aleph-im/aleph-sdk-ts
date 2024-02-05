import { BaseMessage } from './types'
import * as aggregate from './aggregate'
import * as forget from './forget'
import * as post from './post'
import * as program from './program'
import * as instance from './instance'
import * as store from './store'
import * as any from './any'

export { aggregate, forget, post, program, instance, store, any }

/**
 * Extracts some fields from an Aleph message to sign it using an account.
 *
 * @param message The message used to extract data.
 */
export function GetVerificationBuffer(message: BaseMessage): Buffer {
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}
