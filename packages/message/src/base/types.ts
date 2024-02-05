import { Blockchain } from '@aleph-sdk/core'
import { MessageType, BaseMessage } from '../types'

export type GetMessageParams = {
  hashes: string[]
  channels?: string[]
  messageType?: MessageType
  APIServer?: string
}

export type GetMessageConfiguration = {
  hash: string
  channel?: string
  messageType?: MessageType
  APIServer?: string
}

// --------- MESSAGES ------------

export type MessageQueryResponse = {
  messages: BaseMessage[]
  pagination_page: number
  pagination_total: number
  pagination_per_page: number
  pagination_item: string
}

export type GetMessagesConfiguration = {
  pagination?: number
  page?: number
  addresses?: string[]
  channels?: string[]
  chains?: Blockchain[]
  refs?: string[]
  tags?: string[]
  contentTypes?: string[]
  contentKeys?: string[]
  hashes?: string[]
  messageType?: MessageType
  startDate?: Date
  endDate?: Date
  APIServer?: string
}

export type GetMessagesParams = {
  pagination?: number
  page?: number
  addresses?: string
  channels?: string
  chains?: string
  refs?: string
  tags?: string
  contentTypes?: string
  contentKeys?: string
  hashes?: string
  msgType?: string
  startDate?: number
  endDate?: number
}
