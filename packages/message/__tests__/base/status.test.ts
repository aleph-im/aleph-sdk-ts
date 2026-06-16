import axios from 'axios'

import { BaseMessageClient, MessageNotFoundError, MessageStatus } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Message status retrieval', () => {
  const apiServer = 'https://api.example.org'
  const client = new BaseMessageClient(apiServer)
  const itemHash = 'f'.repeat(64)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getStatus returns the status info from the status endpoint', async () => {
    const data = { status: MessageStatus.processed, item_hash: itemHash, reception_time: '2024-01-01T00:00:00Z' }
    mockedAxios.isAxiosError.mockReturnValue(false)
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getStatus(itemHash)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/messages/${itemHash}/status`, expect.anything())
  })

  it('getStatus throws MessageNotFoundError on a 404', async () => {
    const error = { isAxiosError: true, response: { status: 404 } }
    mockedAxios.isAxiosError.mockReturnValue(true)
    mockedAxios.get.mockRejectedValueOnce(error)

    await expect(client.getStatus(itemHash)).rejects.toThrow(MessageNotFoundError)
  })
})
