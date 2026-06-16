import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios from 'axios'

import {
  AggregateContent,
  AggregateGetConfiguration,
  AggregateGetResponse,
  AggregatePublishConfiguration,
  GetAggregatesConfiguration,
  PaginatedAggregates,
} from './types'
import { AggregateMessage, ItemType, MessageType } from '../types'
import { MessageNotFoundError } from '../types/errors'
import { buildMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { toQueryParam } from '../utils/queryParams'
import { broadcast } from '../utils/signature'

export class AggregateMessageClient {
  apiServer: string
  protected messageType = MessageType.aggregate

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Retrieves an aggregate message on from the Aleph network.
   * It uses the address & key(s) provided in the configuration given as a parameter to retrieve the wanted message.
   *
   * @param configuration The configuration used to get the message, including the API endpoint.
   */
  async get<T = any>({ address = '', keys }: AggregateGetConfiguration): Promise<Record<string, T>> {
    try {
      const response = await axios.get<AggregateGetResponse<T>>(`${this.apiServer}/api/v0/aggregates/${address}.json`, {
        socketPath: getSocketPath(),
        params: {
          keys: toQueryParam(keys),
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
   * Retrieves a paginated list of aggregates across addresses.
   *
   * @param config Optional key/address filters, sorting and pagination.
   */
  async getAggregates({
    keys,
    addresses,
    sortBy,
    sortOrder,
    pagination,
    page,
  }: GetAggregatesConfiguration = {}): Promise<PaginatedAggregates> {
    const response = await axios.get<PaginatedAggregates>(`${this.apiServer}/api/v0/aggregates`, {
      params: {
        keys: toQueryParam(keys),
        addresses: toQueryParam(addresses),
        sortBy,
        sortOrder,
        pagination,
        page,
      },
      socketPath: getSocketPath(),
    })
    return response.data
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

    const builtMessage = buildMessage(
      {
        account,
        channel,
        timestamp,
        storageEngine,
        content: aggregateContent,
      },
      this.messageType,
    )

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
