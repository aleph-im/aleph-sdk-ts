import { Blockchain } from '@aleph-sdk/core'
import { Account } from '@aleph-sdk/account'
import { ItemType, MessageType } from '../types'
import { PostContent } from '../post'
import { AggregateContent } from '../aggregate'
import { StoreContent } from '../store'
import { ProgramContent } from '../program'
import { InstanceContent } from '../instance'
import { ForgetContent } from '../forget'

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
  GetVerificationBuffer: () => Buffer
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
    GetVerificationBuffer: function () {
      return Buffer.from(`${this.chain}\n${this.sender}\n${this.type}\n${this.item_hash}`)
    },
  }
}

export function PostMessageBuilder<T = unknown>(
  config: Omit<MessageBuilderConfig<PostContent<T>, MessageType.post>, 'type'>,
): BuiltMessage<PostContent<T>, MessageType.post> {
  return MessageBuilder<PostContent<T>, MessageType.post>({
    ...config,
    type: MessageType.post,
  })
}

export function AggregateMessageBuilder<T = unknown>(
  config: Omit<MessageBuilderConfig<AggregateContent<T>, MessageType.aggregate>, 'type'>,
): BuiltMessage<AggregateContent<T>, MessageType.aggregate> {
  return MessageBuilder<AggregateContent<T>, MessageType.aggregate>({
    ...config,
    type: MessageType.aggregate,
  })
}

export function StoreMessageBuilder(
  config: Omit<MessageBuilderConfig<StoreContent, MessageType.store>, 'type'>,
): BuiltMessage<StoreContent, MessageType.store> {
  return MessageBuilder<StoreContent, MessageType.store>({
    ...config,
    type: MessageType.store,
  })
}

export function ProgramMessageBuilder(
  config: Omit<MessageBuilderConfig<ProgramContent, MessageType.program>, 'type'>,
): BuiltMessage<ProgramContent, MessageType.program> {
  return MessageBuilder<ProgramContent, MessageType.program>({
    ...config,
    type: MessageType.program,
  })
}

export function InstanceMessageBuilder(
  config: Omit<MessageBuilderConfig<InstanceContent, MessageType.instance>, 'type'>,
): BuiltMessage<InstanceContent, MessageType.instance> {
  return MessageBuilder<InstanceContent, MessageType.instance>({
    ...config,
    type: MessageType.instance,
  })
}

export function ForgetMessageBuilder(
  config: Omit<MessageBuilderConfig<ForgetContent, MessageType.forget>, 'type'>,
): BuiltMessage<ForgetContent, MessageType.forget> {
  return MessageBuilder<ForgetContent, MessageType.forget>({
    ...config,
    type: MessageType.forget,
  })
}
