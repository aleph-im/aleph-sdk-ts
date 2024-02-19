import axios from 'axios'

import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import {
  PostContent,
  PostGetConfiguration,
  PostQueryParams,
  PostQueryResponse,
  PostSubmitConfiguration,
  PostMessage,
} from './types'
import { PostMessageBuilder, prepareAlephMessage, broadcast } from '../utils'
import { ItemType } from '../types'

export class PostMessageClient {
  /**
   * Retrieves a post message on from the Aleph network.
   * It uses the type(s) provided in the configuration given as a parameter to retrieve the wanted message.
   * It also uses the pagination and page parameter to limit the number of messages to retrieve.
   *
   * @param configuration The configuration used to get the message, including the API endpoint.
   */
  async get<T>({
    types = '',
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
      pagination: pagination,
      page: page,
      refs: refs.join(',') || undefined,
      addresses: addresses.join(',') || undefined,
      tags: tags.join(',') || undefined,
      hashes: hashes.join(',') || undefined,
      channels: channels?.join(',') || undefined,
    }

    const response = await axios.get<PostQueryResponse<T>>(`${stripTrailingSlash(apiServer)}/api/v0/posts.json`, {
      params,
      socketPath: getSocketPath(),
    })
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
      storageEngine,
      content: postContent,
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

export default PostMessageClient
