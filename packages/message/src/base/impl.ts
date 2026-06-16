import { DEFAULT_API_V2, DEFAULT_API_WS_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios, { type AxiosResponse } from 'axios'

import {
  CursorMessagesResponse,
  GetMessageConfiguration,
  GetMessageParams,
  GetMessagesConfiguration,
  GetMessagesCursorConfiguration,
  GetMessagesCursorParams,
  GetMessagesParams,
  MessageError,
  MessageResponse,
  MessagesQueryResponse,
} from './types'
import {
  MessageContent,
  MessageStatus,
  MessageStatusInfo,
  MessageType,
  MessageTypeMap,
  PublishedMessage,
} from '../types'
import { AlephSocket, getMessagesSocket, GetMessagesSocketConfiguration } from './websocket'
import { ForgottenMessageError, MessageNotFoundError, QueryError } from '../types/errors'
import { toQueryParam } from '../utils'

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
      const data = response.data
      status = data.status
      if (data.status === MessageStatus.pending) {
        message = data.messages[0]
        forgotten_by = []
      } else {
        message = data.message
        forgotten_by = data.forgotten_by || []
      }
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
    const data = response.data
    if (data.status === MessageStatus.pending) return null
    if (data.status === MessageStatus.forgotten)
      throw new ForgottenMessageError(
        `The requested message ${data.item_hash} has been forgotten by ${data.forgotten_by.join(', ')}`,
      )
    if (data.status !== MessageStatus.rejected) return null
    return {
      error_code: data.error_code,
      details: data.details,
    }
  }

  /**
   * Retrieves the processing status of a message (pending, processed, rejected or forgotten).
   *
   * Lighter than {@link get}: it returns only the status and reception time, without the
   * message content.
   *
   * @param item_hash The hash of the message to query.
   */
  async getStatus(item_hash: string): Promise<MessageStatusInfo> {
    try {
      const response = await axios.get<MessageStatusInfo>(`${this.apiServer}/api/v0/messages/${item_hash}/status`, {
        socketPath: getSocketPath(),
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new MessageNotFoundError(`No such hash ${item_hash}`)
      }
      throw error
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
    addresses,
    channels,
    chains,
    refs,
    tags,
    contentTypes,
    contentKeys,
    hashes,
    messageTypes,
    paymentTypes,
    startDate,
    endDate,
  }: GetMessagesConfiguration): Promise<MessagesQueryResponse> {
    const params: GetMessagesParams = {
      pagination,
      page,
      addresses: toQueryParam(addresses),
      channels: toQueryParam(channels),
      chains: toQueryParam(chains),
      refs: toQueryParam(refs),
      tags: toQueryParam(tags),
      contentTypes: toQueryParam(contentTypes),
      contentKeys: toQueryParam(contentKeys),
      hashes: toQueryParam(hashes),
      msgTypes: toQueryParam(messageTypes),
      paymentTypes: toQueryParam(paymentTypes),
      startDate: startDate ? startDate.valueOf() / 1000 : undefined,
      endDate: endDate ? endDate.valueOf() / 1000 : undefined,
    }

    const response = (await axios.get<MessagesQueryResponse>(`${this.apiServer}/api/v0/messages.json`, {
      params,
      socketPath: getSocketPath(),
    })) as AxiosResponse<MessagesQueryResponse>

    return response.data
  }

  /**
   * Retrieves Messages using cursor-based pagination.
   * Pass an empty cursor (or omit it) to start from the beginning.
   *
   * @param configuration The message params to make the query.
   */
  async getCursor({
    pagination = 200,
    cursor = '',
    addresses,
    channels,
    chains,
    refs,
    tags,
    contentTypes,
    contentKeys,
    hashes,
    messageTypes,
    paymentTypes,
    startDate,
    endDate,
  }: GetMessagesCursorConfiguration): Promise<CursorMessagesResponse> {
    const params: GetMessagesCursorParams = {
      pagination: Math.min(pagination, 200),
      cursor,
      addresses: toQueryParam(addresses),
      channels: toQueryParam(channels),
      chains: toQueryParam(chains),
      refs: toQueryParam(refs),
      tags: toQueryParam(tags),
      contentTypes: toQueryParam(contentTypes),
      contentKeys: toQueryParam(contentKeys),
      hashes: toQueryParam(hashes),
      msgTypes: toQueryParam(messageTypes),
      paymentTypes: toQueryParam(paymentTypes),
      startDate: startDate ? startDate.valueOf() / 1000 : undefined,
      endDate: endDate ? endDate.valueOf() / 1000 : undefined,
    }

    const response = (await axios.get<CursorMessagesResponse>(`${this.apiServer}/api/v0/messages.json`, {
      params,
      socketPath: getSocketPath(),
    })) as AxiosResponse<CursorMessagesResponse>

    return response.data
  }

  /**
   * Returns an async iterator over all messages matching the given filters.
   * Handles cursor-based pagination automatically.
   *
   * @param configuration The message filters (same as getAll, minus `page`).
   */
  async *getAsyncIterator(
    configuration: Omit<GetMessagesCursorConfiguration, 'cursor'>,
  ): AsyncGenerator<PublishedMessage<MessageContent>> {
    let cursor: string = ''
    while (true) {
      const response = await this.getCursor({ ...configuration, cursor })
      for (const message of response.messages) {
        yield message
      }
      if (response.next_cursor === null) {
        break
      }
      cursor = response.next_cursor
    }
  }

  async getMessagesSocket(params: Omit<GetMessagesSocketConfiguration, 'apiServer'>): Promise<AlephSocket> {
    return getMessagesSocket({
      ...params,
      apiServer: this.wsServer,
    })
  }
}

export default BaseMessageClient
