import axios from 'axios'

import { BaseMessageClient, MessageStatus, MessageType } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Message query param mapping', () => {
  const apiServer = 'https://api.example.org'
  const client = new BaseMessageClient(apiServer)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getAll forwards the full set of filters, mapping names and serializing arrays', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { messages: [] } })

    await client.getAll({
      owners: ['0xowner'],
      contentHashes: ['Qm1', 'Qm2'],
      messageTypes: [MessageType.store],
      messageStatuses: [MessageStatus.processed, MessageStatus.pending],
      startBlock: 100,
      endBlock: 200,
      sortBy: 'tx-time',
      sortOrder: 1,
      contentFormat: 'none',
    })

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/messages.json`,
      expect.objectContaining({
        params: expect.objectContaining({
          owners: '0xowner',
          contentHashes: 'Qm1,Qm2',
          msgTypes: 'STORE',
          msgStatuses: 'processed,pending',
          startBlock: 100,
          endBlock: 200,
          sortBy: 'tx-time',
          sortOrder: 1,
          contentFormat: 'none',
        }),
      }),
    )
  })

  it('getCursor forwards the same new filters', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { messages: [], next_cursor: null } })

    await client.getCursor({ owners: ['0xowner'], contentFormat: 'headers', sortBy: 'time', sortOrder: -1 })

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/messages.json`,
      expect.objectContaining({
        params: expect.objectContaining({
          owners: '0xowner',
          contentFormat: 'headers',
          sortBy: 'time',
          sortOrder: -1,
        }),
      }),
    )
  })
})
