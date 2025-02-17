import { Account } from '@aleph-sdk/account'
import { Blockchain } from '@aleph-sdk/core'
import { EVMAccount } from '@aleph-sdk/evm'

import { AggregateContent } from '../aggregate'
import { ForgetContent } from '../forget'
import { PostContent } from '../post'
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

export function PostMessageBuilder<T = unknown>(
  config: MessageBuilderConfig<PostContent<T>>,
): BuiltMessage<PostContent<T>> {
  return buildMessage<PostContent<T>>(config, MessageType.post) as BuiltMessage<PostContent<T>>
}

export function buildAggregateMessage<T>(
  config: MessageBuilderConfig<AggregateContent<T>>,
): BuiltMessage<AggregateContent<T>> {
  return buildMessage<AggregateContent<T>>(config, MessageType.aggregate) as BuiltMessage<AggregateContent<T>>
}

export function buildForgetMessage(config: MessageBuilderConfig<ForgetContent>): BuiltMessage<ForgetContent> {
  return buildMessage<ForgetContent>(config, MessageType.forget) as BuiltMessage<ForgetContent>
}
