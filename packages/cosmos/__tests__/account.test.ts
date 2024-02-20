import { verifyCosmos, CosmosAccount, NewAccount } from '../src'
import { SignableMessage } from '../../account/src'

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
      getVerificationBuffer: () => {
        return Buffer.from('Test message')
      },
    }

    const signature = await cosmosAccount.sign(message)
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
