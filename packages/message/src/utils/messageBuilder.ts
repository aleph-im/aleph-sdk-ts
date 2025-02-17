import { Account } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'
import { EVMAccount } from '@aleph-sdk/evm'

import { BuiltMessage, ItemType, MessageContent, MessageType } from '../types'

export type MessageBuilderConfig<C> = {
  storageEngine: ItemType
  account: Account
  channel?: string
  timestamp: number
  content: C
}

export function buildMessage<C extends MessageContent>(
  config: MessageBuilderConfig<C>,
  type: MessageType,
): BuiltMessage<C> {
  return new BuiltMessage<C>({
    chain: config.account instanceof EVMAccount ? Blockchain.ETH : config.account.getChain(),
    sender: config.account.address,
    channel: config.channel,
    time: config.timestamp,
    item_type: config.storageEngine,
    content: config.content,
    type,
  })
}
