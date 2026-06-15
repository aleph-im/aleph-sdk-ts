import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios from 'axios'

import {
  GetAccountBalanceConfiguration,
  GetAccountBalanceResponse,
  GetAccountCreditHistoryResponse,
  GetBalancesConfiguration,
  GetCreditBalancesConfiguration,
  GetCreditHistoryConfiguration,
  GetResourceConsumedCreditsResponse,
  PaginatedBalances,
  PaginatedCreditBalances,
} from './types'
import { toQueryParam } from '../utils/queryParams'

export class BalanceClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Retrieves the token balance of a single address, including the locked amount and credit balance.
   *
   * @param address The address to query.
   * @param config Optional chain filter and credit-details toggle.
   */
  async getBalance(
    address: string,
    { chain, includeCreditDetails }: GetAccountBalanceConfiguration = {},
  ): Promise<GetAccountBalanceResponse> {
    const response = await axios.get<GetAccountBalanceResponse>(
      `${this.apiServer}/api/v0/addresses/${address}/balance`,
      {
        params: {
          chain,
          include_credit_details: includeCreditDetails,
        },
        socketPath: getSocketPath(),
      },
    )
    return response.data
  }

  /**
   * Retrieves a paginated list of token balances across chains.
   *
   * @param config Optional chain filter, minimum balance and pagination.
   */
  async getBalances({
    pagination,
    page,
    chains,
    minBalance,
  }: GetBalancesConfiguration = {}): Promise<PaginatedBalances> {
    const response = await axios.get<PaginatedBalances>(`${this.apiServer}/api/v0/balances`, {
      params: {
        pagination,
        page,
        chains: toQueryParam(chains),
        min_balance: minBalance,
      },
      socketPath: getSocketPath(),
    })
    return response.data
  }

  /**
   * Retrieves a paginated list of credit balances.
   *
   * @param config Optional minimum balance and pagination.
   */
  async getCreditBalances({
    pagination,
    page,
    minBalance,
  }: GetCreditBalancesConfiguration = {}): Promise<PaginatedCreditBalances> {
    const response = await axios.get<PaginatedCreditBalances>(`${this.apiServer}/api/v0/credit_balances`, {
      params: {
        pagination,
        page,
        min_balance: minBalance,
      },
      socketPath: getSocketPath(),
    })
    return response.data
  }

  /**
   * Retrieves the credit history of a single address.
   *
   * @param address The address to query.
   * @param config Optional filters (transaction, token, chain, payment method, ...) and pagination.
   */
  async getCreditHistory(
    address: string,
    {
      pagination,
      page,
      txHash,
      token,
      chain,
      provider,
      origin,
      originRef,
      paymentMethod,
      hasExpiration,
      excludePaymentMethod,
      sortBy,
      sortOrder,
    }: GetCreditHistoryConfiguration = {},
  ): Promise<GetAccountCreditHistoryResponse> {
    const response = await axios.get<GetAccountCreditHistoryResponse>(
      `${this.apiServer}/api/v0/addresses/${address}/credit_history`,
      {
        params: {
          pagination,
          page,
          tx_hash: txHash,
          token,
          chain,
          provider,
          origin,
          origin_ref: originRef,
          payment_method: paymentMethod,
          has_expiration: hasExpiration,
          exclude_payment_method: toQueryParam(excludePaymentMethod),
          sort_by: sortBy,
          sort_order: sortOrder,
        },
        socketPath: getSocketPath(),
      },
    )
    return response.data
  }

  /**
   * Retrieves the amount of credits consumed by a resource (identified by its message hash).
   *
   * @param itemHash The hash of the resource's message.
   */
  async getConsumedCredits(itemHash: string): Promise<GetResourceConsumedCreditsResponse> {
    const response = await axios.get<GetResourceConsumedCreditsResponse>(
      `${this.apiServer}/api/v0/messages/${itemHash}/consumed_credits`,
      {
        socketPath: getSocketPath(),
      },
    )
    return response.data
  }
}

export default BalanceClient
