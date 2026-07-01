import axios from 'axios'
import shajs from 'sha.js'

import * as ethereum from '../../../ethereum/src'
import { StoreMessageClient } from '../../src'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

function sha256Hex(data: Buffer): string {
  return new shajs.sha256().update(data).digest('hex')
}

describe('Store message upload byte integrity', () => {
  const store = new StoreMessageClient()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Regression: a binary Buffer used to be coerced to a UTF-8 string by FormData,
  // so the uploaded bytes no longer matched item_hash and the API returned
  // "422 File hash does not match".
  it('uploads the exact bytes that were hashed for a binary Buffer', async () => {
    const { account } = ethereum.newAccount()
    // High bytes (> 0x7F) are the ones UTF-8 coercion corrupts. JPEG magic + tail.
    const fileContent = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xc3, 0xa9, 0x80, 0xff, 0xd9])

    let uploadedForm: FormData | undefined
    mockedAxios.post.mockImplementation(async (url: string, data: unknown) => {
      if (url.endsWith('/api/v0/storage/add_file')) {
        uploadedForm = data as FormData
        return { data: { status: 'success', hash: 'irrelevant' } }
      }
      throw new Error(`unexpected POST to ${url}`)
    })

    const message = await store.send({
      channel: 'TEST',
      account,
      fileObject: fileContent,
    })

    expect(uploadedForm).toBeDefined()
    const filePart = uploadedForm!.get('file')
    expect(filePart).toBeInstanceOf(Blob)

    const sentBytes = Buffer.from(await (filePart as Blob).arrayBuffer())
    expect(sha256Hex(sentBytes)).toBe(message.content.item_hash)
    expect(message.content.item_hash).toBe(sha256Hex(fileContent))
  })
})
