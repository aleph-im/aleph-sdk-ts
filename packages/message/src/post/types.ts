import { Account } from '@aleph-sdk/account'
import { BaseContent, ChainRef, ItemType } from '../types/base'

export type PostContent<T> = BaseContent & {
  content?: T
  type: string
  ref?: string | ChainRef
}

// ------- GET -------

export type PostGetConfiguration = {
  types?: string | string[]
  pageSize?: number
  page?: number
  refs?: string[]
  addresses?: string[]
  tags?: string[]
  hashes?: string[]
  channels?: string[]
}

export type PostQueryParams = {
  types?: string | string[]
  pageSize: number
  page: number
  refs?: string | undefined
  addresses?: string | undefined
  tags?: string | undefined
  hashes?: string | undefined
  channels?: string | undefined
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

export type PostPublishConfiguration<T> = {
  ref?: string | ChainRef
  channel?: string
  storageEngine?: ItemType
  account: Account
  address?: string
  postType: string
  content: T
  sync?: boolean
}
