import axios, {AxiosResponse} from 'axios'

import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import {
  PostContent,
  PostGetConfiguration,
  PostQueryParams,
  PostQueryResponse,
  PostSubmitConfiguration,
  PostMessage,
  PostResponse,
} from './types'
import { PostMessageBuilder, prepareAlephMessage, broadcast } from '../utils'
import { ItemType } from '../types'
import {MessageNotFoundError} from "../types/errors";

export class PostMessageClient {
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
   * Retrieves all post messages from the Aleph network.
   * It also uses the pagination and page parameter to limit the number of messages to retrieve.
   *
   * @param types The types of messages to retrieve.
   * @param pagination The number of messages to retrieve.
   * @param page The page number to retrieve.
   * @param apiServer The API server to use.
   * @param channels The channels to retrieve the messages from.
   * @param refs The references to retrieve the messages from.
   * @param addresses The addresses to retrieve the messages from.
   * @param tags The tags to retrieve the messages from.
   * @param hashes The hashes to retrieve the messages from.
   */
  async getAll<T = any>({
    types = [],
    pagination = 50,
    page = 1,
    apiServer = DEFAULT_API_V2,
    channels = [],
    refs = [],
    addresses = [],
    tags = [],
    hashes = [],
  }: PostGetConfiguration): Promise<PostQueryResponse<T>> {
    const params: PostQueryParams = {
      types: types,
      pagination: pagination as number,
      page: page as number,
      refs: refs?.join(',') || undefined,
      addresses: addresses?.join(',') || undefined,
      tags: tags?.join(',') || undefined,
      hashes: hashes?.join(',') || undefined,
      channels: channels?.join(',') || undefined,
    }

    const response = (await axios.get<PostQueryResponse<T>>(
      `${stripTrailingSlash(apiServer as string)}/api/v0/posts.json`,
      {
        params,
        socketPath: getSocketPath(),
      },
    )) as AxiosResponse<PostQueryResponse<T>>
    return response.data
  }

  /**
   * Publishes a post message to the Aleph network.
   *
   * This message must be indexed using a type, you can provide in the configuration.
   *
   * You can amend the message using the type 'amend' and by providing the reference of the message to amend (its hash).
   *
   * @param configuration The configuration used to publish the aggregate message.
   */
  async send<T>({
    account,
    postType,
    content,
    inlineRequested,
    channel,
    ref,
    address,
    storageEngine = ItemType.inline,
    apiServer = DEFAULT_API_V2,
    sync = false,
  }: PostSubmitConfiguration<T>): Promise<PostMessage<T>> {
    if (inlineRequested) console.warn('Inline requested is deprecated and will be removed: use storageEngine.inline')

    const timestamp: number = Date.now() / 1000
    const postContent: PostContent<T> = {
      type: postType,
      address: address || account.address,
      content: content,
      time: timestamp,
    }

    if (ref !== '') postContent.ref = ref

    const builtMessage = PostMessageBuilder({
      account,
      channel,
      timestamp,
      storageEngine: storageEngine as ItemType,
      content: postContent,
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: apiServer as string,
      sync,
    })

    return message
  }
}

export default PostMessageClient
