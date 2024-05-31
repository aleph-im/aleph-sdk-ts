import axios from 'axios'

import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'
import { buildAggregateMessage } from '../utils/messageBuilder'
import {
  AggregateContent,
  AggregateGetConfiguration,
  AggregateGetResponse,
  AggregatePublishConfiguration,
} from './types'
import { ItemType, AggregateMessage } from '../types'
import { MessageNotFoundError } from '../types/errors'

export class AggregateMessageClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Retrieves an aggregate message on from the Aleph network.
   * It uses the address & key(s) provided in the configuration given as a parameter to retrieve the wanted message.
   *
   * @param configuration The configuration used to get the message, including the API endpoint.
   */
  async get<T = any>({ address = '', keys = [] }: AggregateGetConfiguration): Promise<Record<string, T>> {
    try {
      const response = await axios.get<AggregateGetResponse<T>>(`${this.apiServer}/api/v0/aggregates/${address}.json`, {
        socketPath: getSocketPath(),
        params: {
          keys: keys.length > 0 ? keys.join(',') : undefined,
        },
      })

      if (!response.data.data) {
        throw new MessageNotFoundError('no aggregate found')
      }
      return response.data.data
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        throw new MessageNotFoundError('no aggregate found')
      }
      throw e
    }
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
   * @param account The account used to sign the aggregate message.
   * @param address To aggregate content for another account (Required an authorization key)
   * @param key The key used to index the aggregate message.
   * @param content The aggregate message content.
   * @param channel The channel in which the message will be published.
   * @param storageEngine The storage engine to used when storing the message (IPFS, Aleph storage or inline).
   * @param sync If true, the function will wait for the message to be confirmed by the API server.
   */
  async send<T>({
    account,
    address,
    key,
    content,
    channel,
    storageEngine = ItemType.inline,
    sync = false,
  }: AggregatePublishConfiguration<T>): Promise<AggregateMessage<T>> {
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
      apiServer: this.apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: this.apiServer,
      sync,
    })

    return message
  }
}

export default AggregateMessageClient
