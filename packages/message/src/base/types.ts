import { Blockchain } from '@aleph-sdk/core'

import { MessageContent, MessageStatus, MessageType, PublishedMessage } from '../types'

export type GetMessageParams = {
  hashes: string[]
  channels?: string[]
  messageType?: MessageType
}

export type GetMessageConfiguration = {
  hash: string
  messageType?: MessageType
}

export type MessageResponse<T extends MessageContent> = {
  item_hash: string
  message: PublishedMessage<T>
  status: MessageStatus
  forgotten_by?: string[]
}

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
  channels?: string[]
  chains?: Blockchain[]
  refs?: string[]
  tags?: string[]
  contentTypes?: string[]
  contentKeys?: string[]
  hashes?: string[]
  messageTypes?: MessageType[]
  startDate?: Date
  endDate?: Date
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
  msgTypes?: string
  startDate?: number
  endDate?: number
}

export type MessageError = { error_code: string; details: string }
