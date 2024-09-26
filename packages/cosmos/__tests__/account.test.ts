import { CosmosAccount, newAccount } from '../src'
//import { SignableMessage } from '../../account/src'

describe('Cosmos SDK', () => {
  let cosmosAccount: CosmosAccount
  let mnemonicRef: string

  beforeAll(async () => {
    const { account, mnemonic } = await newAccount()
    cosmosAccount = account
    mnemonicRef = mnemonic
  })

  // @todo: Fix this test!
  /* it('should verify Cosmos signature correctly', async () => {
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
  }) */

  describe('Account creation', () => {
    it('should create a new Cosmos account from mnemonic', async () => {
      expect(cosmosAccount).toBeInstanceOf(CosmosAccount)
      expect(mnemonicRef).toBeDefined()
    })
  })
})
