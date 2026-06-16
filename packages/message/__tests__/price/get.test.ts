import axios from 'axios'

import { CostEstimationInstanceContent, PriceClient, VolumePersistence } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const instanceContent: CostEstimationInstanceContent = {
  address: '0x1234567890123456789012345678901234567890',
  time: 1234567890,
  allow_amend: false,
  environment: { reproducible: false, internet: true, aleph_api: true, shared_cache: false },
  resources: { vcpus: 1, memory: 1024, seconds: 30 },
  volumes: [],
  rootfs: {
    parent: { ref: 'f7e68c568906b4ebcd3cd3c4bfdff96c489cd2a9ef73ba2d7503f244dfd578de', use_latest: true },
    persistence: VolumePersistence.host,
    size_mib: 1024,
  },
}

describe('Price endpoints', () => {
  const apiServer = 'https://api.example.org'
  const client = new PriceClient(apiServer)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns a cost estimate for the given instance content', async () => {
    const content = instanceContent
    const data = {
      required_tokens: 1,
      payment_type: 'hold',
      cost: '1.5',
      detail: [],
      charged_address: '0x1',
    }
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data })

    const res = await client.estimateInstanceCost({ content })

    expect(res).toEqual(data)
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${apiServer}/api/v0/price/estimate/instance`,
      content,
      expect.anything(),
    )
  })

  it('returns a summary of the changes after recalculating message costs', async () => {
    const data = {
      message: 'done',
      recalculated_count: 3,
      total_messages: 10,
      pricing_changes_found: 1,
      errors: [],
    }
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data })

    const res = await client.recalculate()

    expect(res).toEqual(data)
    expect(mockedAxios.post).toHaveBeenCalledWith(`${apiServer}/api/v0/price/recalculate`, undefined, expect.anything())
  })
})
