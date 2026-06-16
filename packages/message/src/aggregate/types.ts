import { Account } from '@aleph-sdk/account'

import { BaseContent, ItemType } from '../types/base'

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
  address: string
  keys?: string | string[]
}

// ------- GET (cross-address listing) -------

export type GetAggregatesConfiguration = {
  keys?: string | string[]
  addresses?: string | string[]
  sortBy?: 'last_modified'
  sortOrder?: -1 | 1
  pagination?: number
  page?: number
}

export type PaginatedAggregates = {
  aggregates: Record<string, any>[]
  pagination_per_page: number
  pagination_page: number
  pagination_total: number
  pagination_item: string
}

export type AggregatePublishConfiguration<T> = {
  account: Account
  address?: string
  key: string | AggregateContentKey
  content: T
  channel?: string
  storageEngine?: ItemType
  sync?: boolean
}
