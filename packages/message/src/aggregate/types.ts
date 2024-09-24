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
  keys?: Array<string>
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
