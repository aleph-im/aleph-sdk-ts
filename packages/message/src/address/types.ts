// ------- GET /api/v0/addresses/{address}/files -------

export type AccountFile = {
  file_hash: string
  size: number
  type: string
  created: string
  item_hash: string
}

export type GetAccountFilesConfiguration = {
  pagination?: number
  page?: number
  sortOrder?: number
  /** If set, only return the file with this hash (if owned by the address). */
  fileHash?: string
}

export type GetAccountFilesResponse = {
  address: string
  total_size: number
  files: AccountFile[]
  pagination_page: number
  pagination_total: number
  pagination_per_page: number
}

// ------- GET /api/v0/addresses/{address}/post_types -------

export type GetAccountPostTypesResponse = {
  address: string
  post_types: string[]
}

// ------- GET /api/v0/addresses/{address}/channels -------

export type GetAccountChannelsResponse = {
  address: string
  channels: string[]
}

// ------- GET /api/v0/addresses/stats.json -------

export type GetAddressStatsConfiguration = {
  addresses?: string | string[]
}

export type AddressStatsResponse = {
  data: Record<string, any>
}

// ------- GET /api/v1/addresses/stats.json -------

export type GetAddressStatsV1Configuration = {
  /** Case-insensitive substring filter for addresses. */
  addressContains?: string
  sortBy?: string
  sortOrder?: number
  pagination?: number
  page?: number
}

export type AddressStatsV1Response = {
  data: Record<string, any>
  pagination_per_page: number
  pagination_page: number
  pagination_total: number
  pagination_item: string
}
