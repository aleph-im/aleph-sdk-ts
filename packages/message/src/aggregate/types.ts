import { Account } from '@aleph-sdk/account'
import { BaseContent, ItemType, SignedMessage } from '../types/messages'

export type AggregateMessage<T> = SignedMessage<AggregateContent<T>>

export type AggregateContentKey = {
  name: string
}

export type AggregateContent<T> = BaseContent & {
  key: string | AggregateContentKey
  content: T
}

// ------- GET -------

export type AggregateGetResponse<T> = {
  data: T
}

export type AggregateGetConfiguration = {
  apiServer?: string
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
 * apiServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
export type AggregatePublishConfiguration<T> = {
  account: Account
  address?: string
  key: string | AggregateContentKey
  content: T
  channel: string
  storageEngine?: ItemType
  inlineRequested?: boolean
  apiServer?: string
}
