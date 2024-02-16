/**
 * Chain defines which account was used to publish a message.
 * It is automatically provided when publishing messages.
 *
 * Warning: Avax, CSDK, NEO are currently not supported by the TS sdk.
 */
import { Blockchain } from '@aleph-sdk/core'
import { InstanceContent } from '../instance'
import { StoreContent } from '../store'
import { AggregateContent } from '../aggregate'
import { ProgramContent } from '../program'
import { PostContent } from '../post'
import { ForgetContent } from '../forget'

/**
 * Message types supported by Aleph
 *
 * Warning: Program is currently not supported by the TS sdk.
 */
export enum MessageType {
  post = 'POST',
  aggregate = 'AGGREGATE',
  store = 'STORE',
  program = 'PROGRAM',
  forget = 'FORGET',
  instance = 'INSTANCE',
}

export enum ItemType {
  inline = 'inline',
  storage = 'storage',
  ipfs = 'ipfs',
}

/**
 * Some POST messages have a 'ref' field referencing other content
 */
export type ChainRef = {
  chain: string
  channel?: string
  item_content: string
  item_hash: string
  item_type: string
  sender: string
  signature: string
  time: number
  type: MessageType.post
}

type MessageConfirmationHash = {
  binary: string
  type: string
}

/**
 * Format of the result when a message has been confirmed on a blockchain
 * The time and publisher field are introduced in recent versions of CCNs. They should
 * remain optional until the corresponding CCN upload (0.4.0) is widely uploaded.
 */
type MessageConfirmation = {
  chain: string
  height: number
  hash: string | MessageConfirmationHash
  time?: number
  publisher?: string
}

export type BaseContent = {
  address: string
  time: number
}

export type MessageContent<Content = unknown> =
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
}

export type BaseMessageProps<C extends MessageContent> = {
  chain: Blockchain
  sender: string
  channel: string
  time: number
  item_type: ItemType
  content: C
  type: keyof MessageTypeMap<C>
}

export class BuiltMessage<C extends MessageContent> {
  chain: Blockchain
  sender: string
  type: keyof MessageTypeMap<C>
  channel: string
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
}

export type SignedMessageProps<C extends MessageContent> = HashedMessageProps<C> & {
  signature: string
}

export class SignedMessage<C extends MessageContent> extends HashedMessage<C> {
  signature: string

  constructor(props: SignedMessageProps<C>) {
    super(props)
    this.signature = props.signature
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
