import axios from 'axios'

import { PostMessageClient } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Post query param mapping', () => {
  const apiServer = 'https://api.example.org'
  const client = new PostMessageClient(apiServer)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getAll forwards date range and sorting params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { posts: [] } })

    await client.getAll({
      types: ['my-type'],
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-02T00:00:00Z'),
      sortBy: 'tx-time',
      sortOrder: 1,
    })

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/posts.json`,
      expect.objectContaining({
        params: expect.objectContaining({
          types: 'my-type',
          startDate: new Date('2024-01-01T00:00:00Z').valueOf() / 1000,
          endDate: new Date('2024-01-02T00:00:00Z').valueOf() / 1000,
          sortBy: 'tx-time',
          sortOrder: 1,
        }),
      }),
    )
  })

  it('getCursor forwards the same date range and sorting params', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { posts: [], next_cursor: null } })

    await client.getCursor({ sortBy: 'time', sortOrder: -1 })

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/posts.json`,
      expect.objectContaining({
        params: expect.objectContaining({ sortBy: 'time', sortOrder: -1 }),
      }),
    )
  })
})
