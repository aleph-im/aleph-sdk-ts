import { AggregateMessageClient } from '../../src'
import * as ethereum from '../../../ethereum/src'

describe('Aggregate message publish test', () => {
  const client = new AggregateMessageClient()

  it('should publish an aggregate message', async () => {
    const { account } = ethereum.newAccount()
    const key = 'publishTest'

    const content: { A: number } = {
      A: 1,
    }

    const res = await client.send<{ A: number }>({
      account: account,
      key: key,
      content: content,
      channel: 'TEST',
      sync: true,
    })

    const message = await client.get<{ A: number }>({
      address: account.address,
      keys: [key],
    })

    const expected = {
      [key]: content,
    }

    expect(message).toStrictEqual(expected)
    expect(message[key]).toStrictEqual(res.content.content)
  })
})
