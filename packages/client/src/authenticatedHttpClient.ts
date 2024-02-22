import AlephHttpClient from './httpClient'
import { Account } from '@aleph-sdk/account'
import { DEFAULT_API_V2 } from '@aleph-sdk/core'

export class AuthenticatedAlephHttpClient extends AlephHttpClient {
  account: Account
  constructor(apiServer: string = DEFAULT_API_V2, account: Account) {
    super(apiServer)
    this.account = account
  }
}
