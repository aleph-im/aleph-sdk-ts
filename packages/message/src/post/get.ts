import axios from 'axios'

import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'

type PostGetConfiguration = {
  types: string | string[]
  APIServer?: string
  pagination?: number
  page?: number
  refs?: string[]
  addresses?: string[]
  tags?: string[]
  hashes?: string[]
  channels?: string[]
}

type PostQueryParams = {
  types: string | string[]
  pagination: number
  page: number
  refs?: string
  addresses?: string
  tags?: string
  hashes?: string
  channels?: string
}

type PostResponse<T> = {
  _id: {
    $oid: string
  }
  chain: string
  item_hash: string
  sender: string
  type: string
  channel: string
  confirmed: boolean
  content: T
  item_content: string
  item_type: string
  signature: string
  size: number
  time: number
  original_item_hash: string
  original_signature: string
  original_type: string
  hash: string
  address: string
}

type PostQueryResponse<T> = {
  posts: PostResponse<T>[]
  pagination_page: number
  pagination_total: number
  pagination_per_page: number
  pagination_item: string
}

/**
 * Retrieves a post message on from the Aleph network.
 * It uses the type(s) provided in the configuration given as a parameter to retrieve the wanted message.
 * It also uses the pagination and page parameter to limit the number of messages to retrieve.
 *
 * @param configuration The configuration used to get the message, including the API endpoint.
 */
export async function Get<T>({
  types = '',
  pagination = 50,
  page = 1,
  APIServer = DEFAULT_API_V2,
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

  const response = await axios.get<PostQueryResponse<T>>(`${stripTrailingSlash(APIServer)}/api/v0/posts.json`, {
    params,
    socketPath: getSocketPath(),
  })
  return response.data
}
