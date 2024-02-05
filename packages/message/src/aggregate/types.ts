import { Account } from '@aleph-sdk/account'
import { BaseContent, BaseMessage, ItemType, MessageType } from '../types/base'

export type AggregateContentKey = {
  name: string
}

export type AggregateContent<T> = BaseContent & {
  key: string | AggregateContentKey
  content: T
}

export type AggregateMessage<T> = BaseMessage & {
  content: AggregateContent<T>
  type: MessageType.aggregate
}

// ------- GET -------

export type AggregateGetResponse<T> = {
  data: T
}

export type AggregateGetConfiguration = {
  APIServer?: string
  address: string
  keys?: Array<string>
  limit?: number
}

// ------- PUBLISH -------

/**
 * account:         The account used to sign the aggregate message.
 *
 * address:         To aggregate content for another account (Required an authorization key)
 *
 * key:             The key used to index the aggregate message.
 *
 * content:         The aggregate message content.
 *
 * channel:         The channel in which the message will be published.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * inlineRequested: [Deprecated, use storageEngine instead] - Will the message be inlined ?
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
export type AggregatePublishConfiguration<T> = {
  account: Account
  address?: string
  key: string | AggregateContentKey
  content: T
  channel: string
  storageEngine?: ItemType
  inlineRequested?: boolean
  APIServer?: string
}
