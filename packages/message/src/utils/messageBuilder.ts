import { Blockchain } from '@aleph-sdk/core'
import { Account } from '@aleph-sdk/account'
import { ItemType } from '../types'

export type MessageBuilderConfig<C, T> = {
  storageEngine: ItemType
  account: Account
  channel: string
  timestamp: number
  content: C
  type: T
}

export type BuiltMessage<C, T> = {
  type: T
  time: number
  channel: string
  content: C
  item_type: ItemType
  sender: string
  chain: Blockchain
  size: 0
  item_hash: ''
  signature: ''
  item_content: ''
  confirmed: false
}

export function MessageBuilder<C, T>(config: MessageBuilderConfig<C, T>): BuiltMessage<C, T> {
  return {
    type: config.type,
    time: config.timestamp,
    channel: config.channel,
    content: config.content,
    item_type: config.storageEngine,
    sender: config.account.address,
    chain: config.account.GetChain(),
    size: 0,
    item_hash: '',
    signature: '',
    item_content: '',
    confirmed: false,
  }
}
