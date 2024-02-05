import { Account } from '../../accounts/account'
import { DEFAULT_API_V2 } from '../../global'
import { AggregateContent, AggregateContentKey, AggregateMessage, ItemType, MessageType } from '../types'
import { PutContentToStorageEngine } from '../create/publish'
import { SignAndBroadcast } from '../create/signature'
import { MessageBuilder } from '../../utils/messageBuilder'

/**
 * account:         The account used to sign the aggregate message.
 *
 * address:         To aggregate content for another account (Required an authorization key)
 *
 * key:             The key used to index the aggregate message.
 *
 * content:         The aggregate message content.
 *
 * channel:         The channel in which the message will be published.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * inlineRequested: [Deprecated, use storageEngine instead] - Will the message be inlined ?
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
type AggregatePublishConfiguration<T> = {
  account: Account
  address?: string
  key: string | AggregateContentKey
  content: T
  channel: string
  storageEngine?: ItemType
  inlineRequested?: boolean
  APIServer?: string
}

/**
 * Publishes an aggregate message to the Aleph network.
 *
 * The message's content must respect the following format :
 * {
 *     k_1: v_1,
 *     k_2: v_2,
 * }
 *
 * This message must be indexed using a key, you can provide in the configuration.
 *
 * @param configuration The configuration used to publish the aggregate message.
 */
export async function Publish<T>({
  account,
  address,
  key,
  content,
  channel,
  storageEngine = ItemType.inline,
  inlineRequested,
  APIServer = DEFAULT_API_V2,
}: AggregatePublishConfiguration<T>): Promise<AggregateMessage<T>> {
  if (inlineRequested) console.warn('Inline requested is deprecated and will be removed: use storageEngine.inline')

  const timestamp = Date.now() / 1000
  const aggregateContent: AggregateContent<T> = {
    address: address || account.address,
    key: key,
    time: timestamp,
    content: content,
  }

  const message = MessageBuilder<AggregateContent<T>, MessageType.aggregate>({
    account,
    channel,
    timestamp,
    storageEngine,
    content: aggregateContent,
    type: MessageType.aggregate,
  })

  await PutContentToStorageEngine({
    message: message,
    content: aggregateContent,
    APIServer,
  })

  await SignAndBroadcast({
    message: message,
    account,
    APIServer,
  })

  return message
}
