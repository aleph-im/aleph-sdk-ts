export type PaginationConfiguration = {
  pagination?: number
  page?: number
}

// ------- GET /api/v0/addresses/{address}/balance -------

export type GetAccountBalanceConfiguration = {
  /** Filter by EVM chain. */
  chain?: string
  /** Include credit balance breakdown by expiration date. */
  includeCreditDetails?: boolean
}

export type GetAccountBalanceResponse = {
  address: string
  balance: number
  details: Record<string, any> | null
  locked_amount: number
  credit_balance: number
}

// ------- GET /api/v0/balances -------

export type ChainBalance = {
  address: string
  balance: number
  chain: string
}

export type GetBalancesConfiguration = PaginationConfiguration & {
  chains?: string | string[]
  minBalance?: number
}

export type PaginatedBalances = {
  balances: ChainBalance[]
  pagination_per_page: number
  pagination_page: number
  pagination_total: number
  pagination_item: string
}

// ------- GET /api/v0/credit_balances -------

export type CreditBalance = {
  address: string
  credits: number
}

export type GetCreditBalancesConfiguration = PaginationConfiguration & {
  minBalance?: number
}

export type PaginatedCreditBalances = {
  credit_balances: CreditBalance[]
  pagination_per_page: number
  pagination_page: number
  pagination_total: number
  pagination_item: string
}

// ------- GET /api/v0/addresses/{address}/credit_history -------

export type GetCreditHistoryConfiguration = PaginationConfiguration & {
  txHash?: string
  token?: string
  chain?: string
  provider?: string
  origin?: string
  originRef?: string
  paymentMethod?: string
  /** Filter by presence of an expiration date. */
  hasExpiration?: boolean
  /** Payment methods to exclude. */
  excludePaymentMethod?: string | string[]
  sortBy?: string
  sortOrder?: number
}

export type GetAccountCreditHistoryResponse = {
  address: string
  credit_history: Record<string, any>[]
  pagination_page: number
  pagination_total: number
  pagination_per_page: number
}

// ------- GET /api/v0/messages/{item_hash}/consumed_credits -------

export type GetResourceConsumedCreditsResponse = {
  item_hash: string
  consumed_credits: number
}
