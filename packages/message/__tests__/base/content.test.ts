import axios from 'axios'

import { BaseMessageClient, MessageNotFoundError } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Message content retrieval', () => {
  const apiServer = 'https://api.example.org'
  const client = new BaseMessageClient(apiServer)
  const itemHash = 'f'.repeat(64)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getContent returns the content from the content endpoint', async () => {
    const data = { body: 'hello' }
    mockedAxios.isAxiosError.mockReturnValue(false)
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getContent(itemHash)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/messages/${itemHash}/content`, expect.anything())
  })

  it('getContent throws MessageNotFoundError on a 404', async () => {
    mockedAxios.isAxiosError.mockReturnValue(true)
    mockedAxios.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })

    await expect(client.getContent(itemHash)).rejects.toThrow(MessageNotFoundError)
  })
})
