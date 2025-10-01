export type BaseContent = {
  address: string
  time: number
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

/**
 * Payment Type concerning payment solution
 */
export enum PaymentType {
  hold = 'hold',
  superfluid = 'superfluid',
  credit = 'credit',
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
export type MessageConfirmationHash = {
  binary: string
  type: string
}
/**
 * Format of the result when a message has been confirmed on a blockchain
 * The time and publisher field are introduced in recent versions of CCNs. They should
 * remain optional until the corresponding CCN upload (0.4.0) is widely uploaded.
 */
export type MessageConfirmation = {
  chain: string
  height: number
  hash: string | MessageConfirmationHash
  time?: number
  publisher?: string
}
