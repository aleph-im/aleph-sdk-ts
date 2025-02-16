/**
 * Chain defines which account was used to publish a message.
 * It is automatically provided when publishing messages.
 *
 * Warning: Avax, CSDK, NEO are currently not supported by the TS sdk.
 */
import { Blockchain } from '@aleph-sdk/core'

import { AggregateContent } from '../aggregate'
import { ForgetContent } from '../forget'
import { InstanceContent } from '../instance'
import { PostContent } from '../post'
import { ProgramContent } from '../program'
import { StoreContent } from '../store'
import { ItemType, MessageConfirmation, MessageType } from './base'

export type MessageContent<Content = any> =
  | PostContent<Content>
  | AggregateContent<Content>
  | StoreContent
  | ProgramContent
  | ForgetContent
  | InstanceContent

/**
 * Message types supported by Aleph
 * Some message types come with a content field that can is of a generic type.
 */
export interface MessageTypeMap<Content = any> {
  [MessageType.post]: PostContent<Content>
  [MessageType.aggregate]: AggregateContent<Content>
  [MessageType.store]: StoreContent
  [MessageType.program]: ProgramContent
  [MessageType.forget]: ForgetContent
  [MessageType.instance]: InstanceContent
  [key: string]: MessageContent
}

export type BaseMessageProps<C extends MessageContent> = {
  chain: Blockchain
  sender: string
  channel?: string
  time: number
  item_type: ItemType
  content: C
  type: keyof MessageTypeMap<C>
}

export class BuiltMessage<C extends MessageContent> {
  chain: Blockchain
  sender: string
  type: keyof MessageTypeMap<C>
  channel?: string
  time: number
  item_type: ItemType
  content: C

  constructor(props: BaseMessageProps<C>) {
    this.chain = props.chain
    this.sender = props.sender
    this.channel = props.channel
    this.time = props.time
    this.item_type = props.item_type
    this.content = props.content
    this.type = props.type
  }

  isOfType<T extends MessageType>(type: T): this is BuiltMessage<MessageTypeMap[T]> {
    return this.type === type
  }
}

export type HashedMessageProps<C extends MessageContent> = BaseMessageProps<C> & {
  item_hash: string
  item_content?: string
}

export type CostComputableMessage<C extends MessageContent> = Omit<
  HashedMessage<C>,
  | 'content'
  | 'time'
  | 'chain'
  | 'sender'
  | 'channel'
  | 'getVerificationBuffer'
  | 'isOfType'
  | 'getMessageCostRequestSchema'
>

export class HashedMessage<C extends MessageContent> extends BuiltMessage<C> {
  item_hash: string
  item_content?: string

  constructor(props: HashedMessageProps<C>) {
    super({ ...props, type: props.type })
    this.item_hash = props.item_hash
    this.item_content = props.item_content
    if (props.item_type === ItemType.inline && !props.item_content) {
      throw new Error(`Inline message must have content: ${props}`)
    }
  }

  getVerificationBuffer(): Buffer {
    return Buffer.from([this.chain, this.sender, this.type, this.item_hash].join('\n'))
  }

  /**
   *  Returns a message schema that can be sent to a CCN for cost esstimation
   */
  getMessageCostRequestSchema(): CostComputableMessage<C> {
    return {
      item_type: this.item_type,
      item_hash: this.item_hash,
      item_content: this.item_content,
      type: this.type,
    }
  }
}

export type SignedMessageProps<C extends MessageContent> = HashedMessageProps<C> & {
  signature: string
}

export type BroadcastableMessage<C extends MessageContent> = Omit<
  SignedMessage<C>,
  'content' | 'getVerificationBuffer' | 'isOfType' | 'getBroadcastable' | 'getMessageCostRequestSchema'
>

export class SignedMessage<C extends MessageContent> extends HashedMessage<C> {
  signature: string

  constructor(props: SignedMessageProps<C>) {
    super(props)
    this.signature = props.signature
  }

  /**
   *  Returns a message that can be broadcast to the network
   */
  getBroadcastable(): BroadcastableMessage<C> {
    return {
      chain: this.chain,
      sender: this.sender,
      channel: this.channel,
      time: this.time,
      item_type: this.item_type,
      item_hash: this.item_hash,
      item_content: this.item_content,
      signature: this.signature,
      type: this.type,
    }
  }
}

export type PublishedMessageProps<C extends MessageContent> = SignedMessageProps<C> & {
  confirmations: MessageConfirmation[]
  confirmed: boolean
}

export class PublishedMessage<C extends MessageContent> extends SignedMessage<C> {
  confirmations: MessageConfirmation[]
  confirmed: boolean

  constructor(props: PublishedMessageProps<C>) {
    super(props)
    this.confirmations = props.confirmations || []
    this.confirmed = props.confirmed
  }
}

export type ItemHash = string

export enum MessageStatus {
  pending = 'pending',
  processed = 'processed',
  rejected = 'rejected',
  forgotten = 'forgotten',
}

export type ProgramMessage = SignedMessage<ProgramContent>
export type InstanceMessage = SignedMessage<InstanceContent>
export type StoreMessage = SignedMessage<StoreContent>
export type PostMessage<T> = SignedMessage<PostContent<T>>
export type AggregateMessage<T> = SignedMessage<AggregateContent<T>>
export type ForgetMessage = SignedMessage<ForgetContent>
export type Message =
  | ProgramMessage
  | InstanceMessage
  | StoreMessage
  | PostMessage<any>
  | AggregateMessage<any>
  | ForgetMessage
