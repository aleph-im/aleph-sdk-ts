import { AggregateMessageClient } from '@aleph-sdk/message'
import ethereum from '@aleph-sdk/ethereum'

describe('Aggregate message publish test', () => {
  const client = new AggregateMessageClient()

  it('should publish an aggregate message', async () => {
    const { account } = ethereum.NewAccount()
    const key = 'publishTest'

    const content: { A: number } = {
      A: 1,
    }

    const res = await client.send<{ A: number }>({
      account: account,
      key: key,
      content: content,
      channel: 'TEST',
    })
    const message = await client.get<{ A: number }>({
      address: account.address,
      keys: [key],
    })

    const expected = {
      A: 1,
    }

    expect(message).toStrictEqual(expected)
    expect(message).toStrictEqual(res.content.content)
  })
})
