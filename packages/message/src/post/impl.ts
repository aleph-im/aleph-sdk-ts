import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios, { type AxiosResponse } from 'axios'

import {
  PostContent,
  PostGetConfiguration,
  PostPublishConfiguration,
  PostQueryParams,
  PostQueryResponse,
  PostResponse,
} from './types'
import { ItemType, PostMessage } from '../types'
import { MessageNotFoundError } from '../types/errors'
import { broadcast, PostMessageBuilder, prepareAlephMessage } from '../utils'

export class PostMessageClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Retrieves a post message from the Aleph network.
   * @param config
   */
  async get<T = any>(config: PostGetConfiguration): Promise<PostResponse<T>> {
    const response = await this.getAll<T>(config)
    if (!response.posts || response.posts.length === 0) {
      throw new MessageNotFoundError('No post found')
    } else if (response.posts.length > 1) {
      console.warn('More than one post found, returning the latest one')
    }
    return response.posts[0]
  }

  /**
   * Queries the Aleph network for post messages.
   * @param types       The types of messages to retrieve.
   * @param pagination  The number of messages to retrieve.
   * @param page        The page number to retrieve.
   * @param channels    The channels to retrieve the messages from.
   * @param refs        The references to retrieve the messages from.
   * @param addresses   The addresses to retrieve the messages from.
   * @param tags        The tags to retrieve the messages from.
   * @param hashes      The hashes to retrieve the messages from.
   */
  async getAll<T = any>({
    types = [],
    pagination = 50,
    page = 1,
    channels = [],
    refs = [],
    addresses = [],
    tags = [],
    hashes = [],
  }: PostGetConfiguration): Promise<PostQueryResponse<T>> {
    const any = (value: any) => value && value.length > 0
    const params: PostQueryParams = {
      types,
      pagination,
      page,
      refs: any(refs) ? refs?.join(',') : undefined,
      addresses: any(addresses) ? addresses?.join(',') : undefined,
      tags: any(tags) ? tags?.join(',') : undefined,
      hashes: any(hashes) ? hashes?.join(',') : undefined,
      channels: any(channels) ? channels?.join(',') : undefined,
    }

    const response = (await axios.get<PostQueryResponse<T>>(`${this.apiServer}/api/v0/posts.json`, {
      params,
      socketPath: getSocketPath(),
    })) as AxiosResponse<PostQueryResponse<T>>
    return response.data
  }

  /**
   * Publishes a post message to the Aleph network.
   * @param account               The account used to sign the message.
   * @param postType              The user-defined post type of the post message. If 'amend', the `ref` field points to the message to amend.
   * @param content               The content of the post message.
   * @param channel               The channel in which the message will be published.
   * @param ref                   A message hash or arbitrary reference. Can be used to index a message for search on query.
   * @param address               The address of the account to post content for. Required an authorization key.
   * @param storageEngine         The storage engine to use when storing the message (IPFS, Aleph storage or inline). [**default: ItemType.inline**]
   * @param sync                  If true, the function will wait for the message to be confirmed before returning. [**default: false**]
   * @returns                     The message that was published.
   * @throws InvalidMessageError  if the message is not compliant with the Aleph protocol.
   * @throws BroadcastError       if the message could not be broadcast for any other reason.
   * @typeParam T                 The type of the content of the message.
   */
  async send<T>({
    account,
    postType,
    content,
    channel,
    ref,
    address,
    storageEngine = ItemType.inline,
    sync = false,
  }: PostPublishConfiguration<T>): Promise<PostMessage<T>> {
    const timestamp: number = Date.now() / 1000
    const postContent: PostContent<T> = {
      type: postType,
      address: address ?? account.address,
      content: content,
      time: timestamp,
    }

    if (ref !== '') postContent.ref = ref

    const builtMessage = PostMessageBuilder({
      account,
      channel,
      timestamp,
      storageEngine,
      content: postContent,
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

export default PostMessageClient
