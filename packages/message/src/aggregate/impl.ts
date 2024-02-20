import axios from 'axios'

import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'
import { buildAggregateMessage } from '../utils/messageBuilder'
import {
  AggregateContent,
  AggregateGetConfiguration,
  AggregateGetResponse,
  AggregateMessage,
  AggregatePublishConfiguration,
} from './types'
import { ItemType } from '../types'
import { MessageNotFoundError } from '../types/errors'

export class AggregateMessageClient {
  /**
   * Retrieves an aggregate message on from the Aleph network.
   * It uses the address & key(s) provided in the configuration given as a parameter to retrieve the wanted message.
   *
   * @param configuration The configuration used to get the message, including the API endpoint.
   */
  async get<T>({
    apiServer = DEFAULT_API_V2,
    address = '',
    keys = [],
    limit = 50,
  }: AggregateGetConfiguration): Promise<T> {
    const response = await axios.get<AggregateGetResponse<T>>(
      `${stripTrailingSlash(apiServer)}/api/v0/aggregates/${address}.json`,
      {
        socketPath: getSocketPath(),
        params: {
          keys: keys.join(',') || undefined,
          limit,
        },
      },
    )

    if (!response.data.data) {
      throw new MessageNotFoundError('no aggregate found')
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
    apiServer = DEFAULT_API_V2,
    sync = false,
  }: AggregatePublishConfiguration<T>): Promise<AggregateMessage<T>> {
    if (inlineRequested) console.warn('Inline requested is deprecated and will be removed: use storageEngine.inline')

    const timestamp = Date.now() / 1000
    const aggregateContent: AggregateContent<T> = {
      address: address || account.address,
      key: key,
      time: timestamp,
      content: content,
    }

    const builtMessage = buildAggregateMessage({
      account,
      channel,
      timestamp,
      storageEngine,
      content: aggregateContent,
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: apiServer,
      sync,
    })

    return message
  }
}

export default AggregateMessage
