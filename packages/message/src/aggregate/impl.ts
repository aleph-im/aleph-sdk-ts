import axios from 'axios'

import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { PutContentToStorageEngine } from '../utils/publish'
import { SignAndBroadcast } from '../utils/signature'
import { MessageBuilder } from '../utils/messageBuilder'
import {
  AggregateContent,
  AggregateGetConfiguration,
  AggregateGetResponse,
  AggregateMessage,
  AggregatePublishConfiguration,
} from './types'
import { ItemType, MessageType } from '../types'

export class AggregateMessageClient {
  /**
   * Retrieves an aggregate message on from the Aleph network.
   * It uses the address & key(s) provided in the configuration given as a parameter to retrieve the wanted message.
   *
   * @param configuration The configuration used to get the message, including the API endpoint.
   */
  async get<T>({
    APIServer = DEFAULT_API_V2,
    address = '',
    keys = [],
    limit = 50,
  }: AggregateGetConfiguration): Promise<T> {
    const response = await axios.get<AggregateGetResponse<T>>(
      `${stripTrailingSlash(APIServer)}/api/v0/aggregates/${address}.json`,
      {
        socketPath: getSocketPath(),
        params: {
          keys: keys.join(',') || undefined,
          limit,
        },
      },
    )

    if (!response.data.data) {
      throw new Error('no aggregate found')
    }
    return response.data.data
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
  async send<T>({
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
}

export default AggregateMessage
