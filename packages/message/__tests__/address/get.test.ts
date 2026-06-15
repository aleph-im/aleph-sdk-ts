import axios from 'axios'

import { AddressClient } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Address-scoped queries', () => {
  const apiServer = 'https://api.example.org'
  const client = new AddressClient(apiServer)
  const address = '0x1234567890123456789012345678901234567890'

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getFiles maps camelCase config to snake_case query params', async () => {
    const data = {
      address,
      total_size: 4,
      files: [{ file_hash: 'Qm', size: 4, type: 'file', created: '2024', item_hash: 'h' }],
      pagination_page: 1,
      pagination_total: 1,
      pagination_per_page: 100,
    }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getFiles(address, { sortOrder: -1, fileHash: 'Qm', page: 2 })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/addresses/${address}/files`,
      expect.objectContaining({
        params: expect.objectContaining({ sort_order: -1, file_hash: 'Qm', page: 2 }),
      }),
    )
  })

  it('getPostTypes queries the post_types endpoint', async () => {
    const data = { address, post_types: ['my-type'] }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getPostTypes(address)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/addresses/${address}/post_types`,
      expect.anything(),
    )
  })

  it('getChannels queries the channels endpoint', async () => {
    const data = { address, channels: ['TEST'] }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getChannels(address)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/addresses/${address}/channels`, expect.anything())
  })

  it('getStats (v0) normalizes a single address into an array param', async () => {
    const data = { data: { messages: 5 } }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getStats({ addresses: address })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/addresses/stats.json`,
      expect.objectContaining({ params: { addresses: [address] } }),
    )
  })

  it('getStats (v0) passes an array of addresses through unchanged', async () => {
    const addresses = [address, '0x0987654321098765432109876543210987654321']
    const data = { data: { messages: 5 } }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getStats({ addresses })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/addresses/stats.json`,
      expect.objectContaining({ params: { addresses } }),
    )
  })

  it('getStatsV1 forwards the v1 filter and pagination params', async () => {
    const data = {
      data: {},
      pagination_per_page: 100,
      pagination_page: 1,
      pagination_total: 0,
      pagination_item: 'stats',
    }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getStatsV1({
      addressContains: 'abc',
      sortBy: 'messages',
      sortOrder: -1,
      pagination: 50,
      page: 2,
    })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v1/addresses/stats.json`,
      expect.objectContaining({
        params: expect.objectContaining({
          addressContains: 'abc',
          sortBy: 'messages',
          sortOrder: -1,
          pagination: 50,
          page: 2,
        }),
      }),
    )
  })
})
