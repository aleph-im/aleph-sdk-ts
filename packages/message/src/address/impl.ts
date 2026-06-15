import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios from 'axios'

import {
  AddressStatsResponse,
  AddressStatsV1Response,
  GetAccountChannelsResponse,
  GetAccountFilesConfiguration,
  GetAccountFilesResponse,
  GetAccountPostTypesResponse,
  GetAddressStatsConfiguration,
  GetAddressStatsV1Configuration,
} from './types'

export class AddressClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Retrieves the files stored by an address, along with their total size.
   *
   * @param address The address to query.
   * @param config Optional file-hash filter, sort order and pagination.
   */
  async getFiles(
    address: string,
    { pagination, page, sortOrder, fileHash }: GetAccountFilesConfiguration = {},
  ): Promise<GetAccountFilesResponse> {
    const response = await axios.get<GetAccountFilesResponse>(`${this.apiServer}/api/v0/addresses/${address}/files`, {
      params: {
        pagination,
        page,
        sort_order: sortOrder,
        file_hash: fileHash,
      },
      socketPath: getSocketPath(),
    })
    return response.data
  }

  /**
   * Retrieves the POST types used by an address.
   *
   * @param address The address to query.
   */
  async getPostTypes(address: string): Promise<GetAccountPostTypesResponse> {
    const response = await axios.get<GetAccountPostTypesResponse>(
      `${this.apiServer}/api/v0/addresses/${address}/post_types`,
      { socketPath: getSocketPath() },
    )
    return response.data
  }

  /**
   * Retrieves the channels used by an address.
   *
   * @param address The address to query.
   */
  async getChannels(address: string): Promise<GetAccountChannelsResponse> {
    const response = await axios.get<GetAccountChannelsResponse>(
      `${this.apiServer}/api/v0/addresses/${address}/channels`,
      { socketPath: getSocketPath() },
    )
    return response.data
  }

  /**
   * Retrieves message statistics for one or more addresses (v0 endpoint).
   *
   * @param config Optional list of addresses to filter on.
   */
  async getStats({ addresses }: GetAddressStatsConfiguration = {}): Promise<AddressStatsResponse> {
    const response = await axios.get<AddressStatsResponse>(`${this.apiServer}/api/v0/addresses/stats.json`, {
      params: {
        addresses: addresses === undefined ? undefined : Array.isArray(addresses) ? addresses : [addresses],
      },
      socketPath: getSocketPath(),
    })
    return response.data
  }

  /**
   * Retrieves paginated message statistics across addresses (v1 endpoint).
   *
   * @param config Optional substring filter, sort and pagination.
   */
  async getStatsV1({
    addressContains,
    sortBy,
    sortOrder,
    pagination,
    page,
  }: GetAddressStatsV1Configuration = {}): Promise<AddressStatsV1Response> {
    const response = await axios.get<AddressStatsV1Response>(`${this.apiServer}/api/v1/addresses/stats.json`, {
      // @note: unlike the v0 endpoints, the v1 stats endpoint expects camelCase
      // query params (addressContains, sortBy, sortOrder) per the API spec.
      params: {
        addressContains,
        sortBy,
        sortOrder,
        pagination,
        page,
      },
      socketPath: getSocketPath(),
    })
    return response.data
  }
}

export default AddressClient
