import { Account } from '@aleph-sdk/account'
import { BaseContent, BaseMessage, ItemType, MessageType } from '../types/base'

export type ForgetContent = BaseContent & {
  hashes: string[]
  reason?: string
}

export type ForgetMessage = BaseMessage & {
  content: ForgetContent
  type: MessageType.forget
}

// ---------- SEND ---------

/**
 * account:         The account used to sign the forget object.
 *
 * channel:         The channel in which the object will be published.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * inlineRequested: [Deprecated, use storageEngine instead] - Will the message be inlined ?
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * hashes:          The Hashes of the Aleph's message to forget.
 *
 * reason:          An optional reason to justify this action (default value: "None").
 */
export type ForgetPublishConfiguration = {
  account: Account
  channel: string
  storageEngine?: ItemType
  inlineRequested?: boolean
  APIServer?: string
  hashes: string[]
  reason?: string
}
