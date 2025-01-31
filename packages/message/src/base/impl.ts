import { DEFAULT_API_V2, DEFAULT_API_WS_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios, { type AxiosResponse } from 'axios'

import {
  GetMessageConfiguration,
  GetMessageParams,
  GetMessagesConfiguration,
  GetMessagesParams,
  MessageError,
  MessageResponse,
  MessagesQueryResponse,
} from './types'
import { MessageStatus, MessageType, MessageTypeMap, PublishedMessage } from '../types'
import { AlephSocket, getMessagesSocket, GetMessagesSocketConfiguration } from './websocket'
import { ForgottenMessageError, MessageNotFoundError, QueryError } from '../types/errors'

export class BaseMessageClient {
  apiServer: string
  wsServer: string

  constructor(apiServer: string = DEFAULT_API_V2, wsServer: string = DEFAULT_API_WS_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
    this.wsServer = stripTrailingSlash(wsServer)
  }

  //TODO: Provide websocket binding (Refacto Get into GetQuerryBuilder)

  /**
   * Retrieves a specific Message with query params.
   *
   * @param configuration The message params to make the query.
   */
  async get<T extends MessageType | 'any' = 'any', Content = any>({
    hash,
    messageType,
  }: GetMessageConfiguration): Promise<PublishedMessage<MessageTypeMap<Content>[T]>> {
    const params: GetMessageParams = {
      hashes: [hash],
      messageType: messageType || undefined,
    }

    let message: PublishedMessage<MessageTypeMap<Content>[T]>
    let status: MessageStatus
    let forgotten_by: string[]
    try {
      const response = await axios.get<MessageResponse<MessageTypeMap<Content>[T]>>(
        `${this.apiServer}/api/v0/messages/${hash}`,
        {
          params,
          socketPath: getSocketPath(),
        },
      )
      message = response.data.message
      status = response.data.status
      forgotten_by = response.data.forgotten_by || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new MessageNotFoundError(`No such hash ${hash}`)
        }
        throw new QueryError(`Error while querying message ${hash}: ${error.toJSON()}`)
      }
      throw error
    }
    if (status === 'forgotten')
      throw new ForgottenMessageError(
        `The requested message ${message.item_hash} has been forgotten by ${forgotten_by?.join(', ')}`,
      )
    if (messageType && message.type !== messageType)
      throw new TypeError(`The message type '${message.type}' does not match the expected type '${messageType}'`)
    return message
  }

  /**
   * Retrieves the error of a rejected message
   *
   * @param item_hash The hash of the rejected message
   */
  async getError(item_hash: string): Promise<MessageError | null> {
    const response = await axios.get(`${stripTrailingSlash(DEFAULT_API_V2)}/api/v0/messages/${item_hash}`, {
      socketPath: getSocketPath(),
    })
    if (response.status === 404) throw new MessageNotFoundError(`No such hash ${item_hash}`)
    const message_raw = response.data
    if (message_raw.status === 'forgotten')
      throw new ForgottenMessageError(
        `The requested message ${message_raw.item_hash} has been forgotten by ${message_raw.forgotten_by.join(', ')}`,
      )
    if (message_raw.status !== 'rejected') return null
    return {
      error_code: message_raw.error_code,
      details: message_raw.details,
    }
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
    messageTypes = [],
    startDate,
    endDate,
  }: GetMessagesConfiguration): Promise<MessagesQueryResponse> {
    const any = (value: any) => value && value.length > 0
    const params: GetMessagesParams = {
      pagination,
      page,
      addresses: any(addresses) ? addresses.join(',') : undefined,
      channels: any(channels) ? channels.join(',') : undefined,
      chains: any(chains) ? chains.join(',') : undefined,
      refs: any(refs) ? refs.join(',') : undefined,
      tags: any(tags) ? tags.join(',') : undefined,
      contentTypes: any(contentTypes) ? contentTypes.join(',') : undefined,
      contentKeys: any(contentKeys) ? contentKeys.join(',') : undefined,
      hashes: any(hashes) ? hashes.join(',') : undefined,
      msgTypes: any(messageTypes) ? messageTypes?.join(',') : undefined,
      startDate: startDate ? startDate.valueOf() / 1000 : undefined,
      endDate: endDate ? endDate.valueOf() / 1000 : undefined,
    }

    const response = (await axios.get<MessagesQueryResponse>(`${this.apiServer}/api/v0/messages.json`, {
      params,
      socketPath: getSocketPath(),
    })) as AxiosResponse<MessagesQueryResponse>

    return response.data
  }

  getMessagesSocket(params: Omit<GetMessagesSocketConfiguration, 'apiServer'>): AlephSocket {
    return getMessagesSocket({
      ...params,
      apiServer: this.wsServer,
    })
  }
}

export default BaseMessageClient
