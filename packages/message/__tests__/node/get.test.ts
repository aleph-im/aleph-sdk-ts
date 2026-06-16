import axios from 'axios'

import { NodeClient } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Node metadata endpoints', () => {
  const apiServer = 'https://api.example.org'
  const client = new NodeClient(apiServer)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getPublicInfo queries the public info endpoint', async () => {
    const data = { node_multi_addresses: ['/ip4/1.2.3.4/tcp/4025/p2p/Qm'] }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getPublicInfo()

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/info/public.json`, expect.anything())
  })

  it('listChannels queries the channels list endpoint', async () => {
    const data = { channels: ['TEST', 'security'] }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.listChannels()

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/channels/list.json`, expect.anything())
  })

  it('getVersion queries the root version endpoint', async () => {
    const data = { version: '1.2.3' }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getVersion()

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/version`, expect.anything())
  })
})
