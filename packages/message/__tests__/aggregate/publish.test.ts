import { aggregate, ethereum } from '../../index'
import { EphAccountList } from '../../testAccount/entryPoint'
import fs from 'fs'

describe('Aggregate message publish test', () => {
  let ephemeralAccount: EphAccountList

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    if (!fs.existsSync('./tests/testAccount/ephemeralAccount.json'))
      throw Error('[Ephemeral Account Generation] - Error, please run: npm run test:regen')
    ephemeralAccount = await import('../../testAccount/ephemeralAccount.json')
    if (!ephemeralAccount.eth.privateKey) throw Error('[Ephemeral Account Generation] - Generated Account corrupted')
  })

  it('should publish an aggregate message', async () => {
    const { privateKey } = ephemeralAccount.eth
    if (!privateKey) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const account = ethereum.ImportAccountFromPrivateKey(privateKey)
    const key = 'publishTest'

    const content: { A: number } = {
      A: 1,
    }

    const res = await aggregate.Publish({
      account: account,
      key: key,
      content: content,
      channel: 'TEST',
    })

    type T = {
      [key]: {
        A: number
      }
    }
    const message = await aggregate.Get<T>({
      address: account.address,
      keys: [key],
    })

    const expected = {
      A: 1,
    }

    expect(message.publishTest).toStrictEqual(expected)
    expect(message.publishTest).toStrictEqual(res.content.content)
  })
})
