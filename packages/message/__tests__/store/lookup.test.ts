import axios from 'axios'

import { StoreMessageClient } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Store lookup endpoints', () => {
  const apiServer = 'https://api.example.org'
  const client = new StoreMessageClient(apiServer)
  const fileHash = 'QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L'

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getFile queries the storage hash endpoint', async () => {
    const data = { status: 'success', hash: fileHash, engine: 'storage', content: 'dGVzdA==' }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getFile(fileHash)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/storage/${fileHash}`, expect.anything())
  })

  it('getFileMetadataByMessageHash queries the by-message-hash endpoint', async () => {
    const messageHash = 'a'.repeat(64)
    const data = { ref: 'r', owner: '0x1', file_hash: fileHash, download_url: '/u', size: 4 }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getFileMetadataByMessageHash(messageHash)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/storage/by-message-hash/${messageHash}`,
      expect.anything(),
    )
  })

  it('getFileMetadataByRef queries the by-ref endpoint', async () => {
    const ref = 'my-ref'
    const data = { ref, owner: '0x1', file_hash: fileHash, download_url: '/u', size: 4 }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getFileMetadataByRef(ref)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/storage/by-ref/${ref}`, expect.anything())
  })

  it('getFileMetadata queries the metadata endpoint', async () => {
    const data = { created: 1, type: 'file' }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getFileMetadata(fileHash)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/storage/metadata/${fileHash}`, expect.anything())
  })

  it('getFilePinsCount queries the count endpoint and returns a number', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: 3 })

    const res = await client.getFilePinsCount(fileHash)

    expect(res).toBe(3)
    expect(mockedAxios.get).toHaveBeenCalledWith(`${apiServer}/api/v0/storage/count/${fileHash}`, expect.anything())
  })
})
