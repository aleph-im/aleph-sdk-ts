import axios from 'axios'
import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'

import {
  GetMessageConfiguration,
  GetMessageParams,
  GetMessagesConfiguration,
  GetMessagesParams,
  MessageQueryResponse,
} from './types'
import { MessageContent, PublishedMessage } from '../types'

export class BaseMessageClient {
  //TODO: Provide websocket binding (Refacto Get into GetQuerryBuilder)

  /**
   * Retrieves a specific Message with query params.
   *
   * @param configuration The message params to make the query.
   */
  async get<T = PublishedMessage<MessageContent>>({
    hash,
    channel,
    messageType,
    apiServer = DEFAULT_API_V2,
  }: GetMessageConfiguration): Promise<T> {
    const params: GetMessageParams = {
      hashes: [hash],
      channels: channel ? [channel] : undefined,
      messageType,
      apiServer,
    }

    const response = await this.getAll(params)
    if (response.messages.length === 0) {
      throw new Error(`No messages found for: ${hash}`)
    }

    const [message] = response.messages
    return message as unknown as T
  }

  /**
   * Retrieves Messages with query params.
   *
   * @param configuration The message params to make the query.
   */
  async getAll({
    pagination = 20,
    page = 1,
    addresses = [],
    channels = [],
    chains = [],
    refs = [],
    tags = [],
    contentTypes = [],
    contentKeys = [],
    hashes = [],
    messageType,
    startDate,
    endDate,
    apiServer = DEFAULT_API_V2,
  }: GetMessagesConfiguration): Promise<MessageQueryResponse> {
    const params: GetMessagesParams = {
      pagination,
      page,
      addresses: addresses.join(',') || undefined,
      channels: channels.join(',') || undefined,
      chains: chains.join(',') || undefined,
      refs: refs.join(',') || undefined,
      tags: tags.join(',') || undefined,
      contentTypes: contentTypes.join(',') || undefined,
      contentKeys: contentKeys.join(',') || undefined,
      hashes: hashes.join(',') || undefined,
      msgType: messageType || undefined,
      startDate: startDate ? startDate.valueOf() / 1000 : undefined,
      endDate: endDate ? endDate.valueOf() / 1000 : undefined,
    }

    const response = await axios.get<MessageQueryResponse>(`${stripTrailingSlash(apiServer)}/api/v0/messages.json`, {
      params,
      socketPath: getSocketPath(),
    })

    return response.data
  }
}

export default BaseMessageClient
