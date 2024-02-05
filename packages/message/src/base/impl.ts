import axios from 'axios'
import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'

import {
  GetMessageConfiguration,
  GetMessageParams,
  GetMessagesConfiguration,
  GetMessagesParams,
  MessageQueryResponse,
} from './types'
import AggregateMessage from '../aggregate'
import type { ForgetMessage } from '../forget/types'
import type { InstanceMessage } from '../instance/types'
import type { PostMessage } from '../post/types'
import type { ProgramMessage } from '../program/types'
import type { StoreMessage } from '../store/types'
import { BaseMessage, MessageType } from '../types'

export class BaseMessageClient {
  static isProgram(message: BaseMessage): message is ProgramMessage {
    if (message === null || typeof message !== 'object') return false
    return message.type === MessageType.program
  }

  static isInstance(message: BaseMessage): message is InstanceMessage {
    if (message === null || typeof message !== 'object') return false
    return message.type === MessageType.instance
  }

  static isStore(message: BaseMessage): message is StoreMessage {
    if (message === null || typeof message !== 'object') return false
    return message.type === MessageType.store
  }

  static isForget(message: BaseMessage): message is ForgetMessage {
    if (message === null || typeof message !== 'object') return false
    return message.type === MessageType.forget
  }

  static isPost<T>(message: BaseMessage): message is PostMessage<T> {
    if (message === null || typeof message !== 'object') return false
    return message.type === MessageType.post
  }

  static isAggregate<T>(message: BaseMessage): message is AggregateMessage<T> {
    if (message === null || typeof message !== 'object') return false
    return message.type === MessageType.aggregate
  }

  //TODO: Provide websocket binding (Refacto Get into GetQuerryBuilder)

  /**
   * Retrieves a specific Message with query params.
   *
   * @param configuration The message params to make the query.
   */
  async get<T = BaseMessage>({
    hash,
    channel,
    messageType,
    APIServer = DEFAULT_API_V2,
  }: GetMessageConfiguration): Promise<T> {
    const params: GetMessageParams = {
      hashes: [hash],
      channels: channel ? [channel] : undefined,
      messageType,
      APIServer,
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
    APIServer = DEFAULT_API_V2,
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

    const response = await axios.get<MessageQueryResponse>(`${stripTrailingSlash(APIServer)}/api/v0/messages.json`, {
      params,
      socketPath: getSocketPath(),
    })

    return response.data
  }
}

export default BaseMessageClient
