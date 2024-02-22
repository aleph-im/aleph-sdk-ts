import { Account } from '@aleph-sdk/account'
import { BaseContent, ItemType, SignedMessage } from '../types/messages'

export type StoreMessage = SignedMessage<StoreContent>

export type StoreContent = BaseContent & {
  item_type: string
  item_hash: string
  size?: number
  content_type?: string
  ref?: string
}

// -------- PIN ----------

/**
 * channel:         The channel in which the message will be published.
 *
 * account:         The account used to sign the aggregate message.
 *
 * fileHash:        The IPFS hash of the content you want to pin.
 *
 * storageEngine:   [Deprecated] - The storage engine to used when storing the message.
 *
 * apiServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
export type StorePinConfiguration = {
  channel: string
  account: Account
  fileHash: string
  storageEngine?: ItemType
}

// -------- SEND -----------

/**
 * channel:         The channel in which the message will be published.
 *
 * account:         The account used to sign the aggregate message.
 *
 * fileObject:      A Blob or the content of the file you want to upload.
 *
 * fileHash:        The IPFS hash of the content you want to pin.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS or Aleph storage).
 *
 * inlineRequested: If set to False, the Store message will be store on the same storageEngine you picked.
 *
 * apiServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * sync:            If true, the function will wait for the message to be confirmed by the API server.
 */
export type StorePublishConfiguration = {
  channel: string
  account: Account
  fileObject?: Buffer | Blob
  fileHash?: string
  storageEngine?: ItemType.ipfs | ItemType.storage
  sync?: boolean
}
