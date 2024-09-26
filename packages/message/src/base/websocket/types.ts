import { Blockchain } from '@aleph-sdk/core'

import { AlephNodeWebSocket } from './alephNodeWebSocket'
import { AlephWebSocket } from './alephWebSocket'
import { BaseContent, ItemType, MessageType } from '../../types'

export type SocketResponse = {
  _id?: string
  chain: Blockchain
  sender: string
  type: MessageType
  channel: string
  confirmations?: boolean
  confirmed: boolean
  signature: string
  size: number
  time: number
  item_type: ItemType
  item_content?: string
  hash_type?: string
  item_hash: string
  content: BaseContent
}

export type GetMessagesSocketConfiguration = {
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
  history?: number
  apiServer?: string
}

export type GetMessagesSocketParams = {
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
  history?: number
}

export type AlephSocket = AlephWebSocket | AlephNodeWebSocket
