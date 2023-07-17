import { Account } from '@aleph-sdk/account'
import { BaseContent, BaseMessage, ChainRef, ItemType, MessageType } from '../types/base'

export type PostContent<T> = BaseContent & {
  content?: T
  type: string
  ref?: string | ChainRef
}

export type PostMessage<T> = BaseMessage & {
  content: PostContent<T>
  type: MessageType.post
}

// ------- GET -------

export type PostGetConfiguration = {
  types: string | string[]
  APIServer?: string
  pagination?: number
  page?: number
  refs?: string[]
  addresses?: string[]
  tags?: string[]
  hashes?: string[]
  channels?: string[]
}

export type PostQueryParams = {
  types: string | string[]
  pagination: number
  page: number
  refs?: string
  addresses?: string
  tags?: string
  hashes?: string
  channels?: string
}

export type PostResponse<T> = {
  _id: {
    $oid: string
  }
  chain: string
  item_hash: string
  sender: string
  type: string
  channel: string
  confirmed: boolean
  content: T
  item_content: string
  item_type: string
  signature: string
  size: number
  time: number
  original_item_hash: string
  original_signature: string
  original_type: string
  hash: string
  address: string
}

export type PostQueryResponse<T> = {
  posts: PostResponse<T>[]
  pagination_page: number
  pagination_total: number
  pagination_per_page: number
  pagination_item: string
}

// ------- PUBLISH -------

/**
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * ref:             A hash or message object to reference another post / transaction hash / address / ...
 *
 * channel:         The channel in which the message will be published.
 *
 * inlineRequested: [Deprecated, use storageEngine instead] - Will the message be inlined ?
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * account:         The account used to sign the aggregate message.
 *
 * address:         To aggregate content for another account (Required an authorization key)
 *
 * postType:        string of your choice like Blog / amend / chat / comment / ...
 *
 * content:         The post message content.
 */
export type PostSubmitConfiguration<T> = {
  APIServer?: string
  ref?: string | ChainRef
  channel: string
  inlineRequested?: boolean
  storageEngine?: ItemType
  account: Account
  address?: string
  postType: string
  content: T
}
