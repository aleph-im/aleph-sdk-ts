import { Blockchain } from '@aleph-sdk/core'

import {
  ContentFormat,
  MessageContent,
  MessageStatus,
  MessageType,
  PaymentType,
  PublishedMessage,
  SortBy,
  SortOrder,
} from '../types'

export type GetMessageParams = {
  hashes: string[]
  channels?: string[]
  messageType?: MessageType
}

export type GetMessageConfiguration = {
  hash: string
  messageType?: MessageType
}

export type MessageResponseProcessed<T extends MessageContent> = {
  item_hash: string
  message: PublishedMessage<T>
  status: Exclude<MessageStatus, 'pending'>
  forgotten_by?: string[]
}

export type MessageResponsePending<T extends MessageContent> = {
  item_hash: string
  messages: PublishedMessage<T>[]
  status: MessageStatus.pending
  reception_time: string
}

export type MessageResponse<T extends MessageContent> = MessageResponseProcessed<T> | MessageResponsePending<T>

// --------- MESSAGES ------------

export type MessagesQueryResponse = {
  messages: PublishedMessage<MessageContent>[]
  pagination_page: number
  pagination_total: number
  pagination_per_page: number
  pagination_item: string
}

export type GetMessagesConfiguration = {
  pagination?: number
  page?: number
  addresses?: string[]
  owners?: string[]
  channels?: string[]
  chains?: Blockchain[]
  refs?: string[]
  tags?: string[]
  contentTypes?: string[]
  contentKeys?: string[]
  contentHashes?: string[]
  hashes?: string[]
  messageTypes?: MessageType[]
  messageStatuses?: MessageStatus[]
  paymentTypes?: PaymentType[]
  startDate?: Date
  endDate?: Date
  startBlock?: number
  endBlock?: number
  sortBy?: SortBy
  sortOrder?: SortOrder
  contentFormat?: ContentFormat
}

export type GetMessagesParams = {
  pagination?: number
  page?: number
  addresses?: string
  owners?: string
  channels?: string
  chains?: string
  refs?: string
  tags?: string
  contentTypes?: string
  contentKeys?: string
  contentHashes?: string
  hashes?: string
  msgTypes?: string
  msgStatuses?: string
  paymentTypes?: string
  startDate?: number
  endDate?: number
  startBlock?: number
  endBlock?: number
  sortBy?: SortBy
  sortOrder?: SortOrder
  contentFormat?: ContentFormat
}

// --------- CURSOR PAGINATION ------------

export type CursorMessagesResponse = {
  messages: PublishedMessage<MessageContent>[]
  pagination_per_page: number
  next_cursor: string | null
}

export type GetMessagesCursorConfiguration = Omit<GetMessagesConfiguration, 'page'> & {
  cursor?: string
}

export type GetMessagesCursorParams = Omit<GetMessagesParams, 'page'> & {
  cursor: string
}

export type MessageError = { error_code: string; details: string }
