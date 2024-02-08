import {
  verifyCosmos,
  CosmosAccount,
  NewAccount,
} from '@aleph-sdk/cosmos'
import { SignableMessage } from '@aleph-sdk/account'

describe('Cosmos SDK', () => {
  let cosmosAccount: CosmosAccount

  beforeAll(async () => {
    const { account } = await NewAccount()
    cosmosAccount = account
  })

  it('should verify Cosmos signature correctly', async () => {
    const message: SignableMessage = {
      time: Date.now(),
      sender: cosmosAccount.address,
      GetVerificationBuffer: () => {
        return Buffer.from('Test message')
      },
    }

    const signature = await cosmosAccount.Sign(message)
    const verified = await verifyCosmos(message, signature)
    expect(verified).toBe(true)
  })

  describe('Account creation', () => {
    it('should create a new Cosmos account from mnemonic', async () => {
      const { account, mnemonic } = await NewAccount()
      expect(account).toBeInstanceOf(CosmosAccount)
      expect(mnemonic).toBeDefined()
    })
  })
})
