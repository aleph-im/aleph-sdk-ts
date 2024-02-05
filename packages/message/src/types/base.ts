/**
 * Chain defines which account was used to publish a message.
 * It is automatically provided when publishing messages.
 *
 * Warning: Avax, CSDK, NEO are currently not supported by the TS sdk.
 */
import { Blockchain } from '@aleph-sdk/core'

/**
 * Supported hash functions
 */
export enum HashType {
  sha256 = 'sha256',
}

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

type MongoDBID = {
  $oid: string
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
 */
type MessageConfirmation = {
  chain: string
  height: number
  hash: string | MessageConfirmationHash
}

export type BaseContent = {
  address: string
  time: number
}

export type BaseMessage = {
  _id?: MongoDBID
  chain: Blockchain
  sender: string
  type: MessageType
  channel: string
  confirmations?: MessageConfirmation[]
  confirmed: boolean
  signature: string
  size: number
  time: number
  item_type: ItemType
  item_content?: string
  hash_type?: HashType
  item_hash: string
  content: BaseContent
}

export type ItemHash = string
