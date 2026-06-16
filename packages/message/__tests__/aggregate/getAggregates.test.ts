import axios from 'axios'

import { AggregateMessageClient } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Cross-address aggregates listing', () => {
  const apiServer = 'https://api.example.org'
  const client = new AggregateMessageClient(apiServer)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getAggregates queries the listing endpoint with serialized filters', async () => {
    const data = {
      aggregates: [{ key: 'profile' }],
      pagination_per_page: 20,
      pagination_page: 1,
      pagination_total: 1,
      pagination_item: 'aggregates',
    }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getAggregates({
      keys: ['profile', 'security'],
      addresses: '0x1',
      sortBy: 'last_modified',
      sortOrder: -1,
      page: 2,
    })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/aggregates`,
      expect.objectContaining({
        params: expect.objectContaining({
          keys: 'profile,security',
          addresses: '0x1',
          sortBy: 'last_modified',
          sortOrder: -1,
          page: 2,
        }),
      }),
    )
  })
})
