import axios from 'axios'

import { BalanceClient } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Balance & credit retrieval', () => {
  const apiServer = 'https://api.example.org'
  const client = new BalanceClient(apiServer)
  const address = '0x1234567890123456789012345678901234567890'

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getBalance queries the address balance endpoint and forwards params', async () => {
    const data = { address, balance: 42, details: null, locked_amount: 1, credit_balance: 10 }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getBalance(address, { chain: 'ETH', includeCreditDetails: true })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/addresses/${address}/balance`,
      expect.objectContaining({
        params: expect.objectContaining({ chain: 'ETH', include_credit_details: true }),
      }),
    )
  })

  it('getBalances maps chains array and minBalance to query params', async () => {
    const data = {
      balances: [{ address, balance: 5, chain: 'ETH' }],
      pagination_per_page: 100,
      pagination_page: 1,
      pagination_total: 1,
      pagination_item: 'balances',
    }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getBalances({ chains: ['ETH', 'AVAX'], minBalance: 1, page: 2 })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/balances`,
      expect.objectContaining({
        params: expect.objectContaining({ chains: 'ETH,AVAX', min_balance: 1, page: 2 }),
      }),
    )
  })

  it('getCreditBalances queries the credit balances endpoint', async () => {
    const data = {
      credit_balances: [{ address, credits: 100 }],
      pagination_per_page: 100,
      pagination_page: 1,
      pagination_total: 1,
      pagination_item: 'credit_balances',
    }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getCreditBalances({ minBalance: 50 })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/credit_balances`,
      expect.objectContaining({ params: expect.objectContaining({ min_balance: 50 }) }),
    )
  })

  it('getCreditHistory maps camelCase filters to snake_case query params', async () => {
    const data = {
      address,
      credit_history: [{ tx_hash: '0xabc' }],
      pagination_page: 1,
      pagination_total: 1,
      pagination_per_page: 100,
    }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getCreditHistory(address, {
      txHash: '0xabc',
      originRef: 'ref-1',
      paymentMethod: 'card',
      hasExpiration: false,
      excludePaymentMethod: ['card', 'sol'],
      sortBy: 'date',
      sortOrder: -1,
    })

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/addresses/${address}/credit_history`,
      expect.objectContaining({
        params: expect.objectContaining({
          tx_hash: '0xabc',
          origin_ref: 'ref-1',
          payment_method: 'card',
          has_expiration: false,
          exclude_payment_method: 'card,sol',
          sort_by: 'date',
          sort_order: -1,
        }),
      }),
    )
  })

  it('getConsumedCredits queries the consumed credits endpoint', async () => {
    const itemHash = 'f'.repeat(64)
    const data = { item_hash: itemHash, consumed_credits: 7 }
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data })

    const res = await client.getConsumedCredits(itemHash)

    expect(res).toEqual(data)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${apiServer}/api/v0/messages/${itemHash}/consumed_credits`,
      expect.anything(),
    )
  })
})
