import * as ethereum from '../../../ethereum/'
import { AggregateMessageClient } from '../../'

describe('Aggregate message update test', () => {
  const client = new AggregateMessageClient()

  it('should publish and update an aggregate message', async () => {
    const { account } = ethereum.NewAccount()
    const key = 'updateTest'

    const content: { A: number } = {
      A: 1,
    }
    const UpdatedContent: { A: number } = {
      A: 10,
    }

    await client.send<{ A: number }>({
      account: account,
      key: key,
      content: content,
      channel: 'TEST',
    })

    const updated = await client.send<{ A: number }>({
      account: account,
      key: key,
      content: UpdatedContent,
      channel: 'TEST',
    })

    const message = await client.get<{ A: number }>({
      address: account.address,
      keys: [key],
    })

    const expected = {
      A: 10,
    }

    expect(message).toStrictEqual(expected)
    expect(message).toStrictEqual(updated.content.content)
  })

  /**
   * This Test is about delegation
   * All value dedicated for the security configuration have to be specified here:
   * createSecurityConfig() inside tests/testAccount/generateAccounts.ts
   */
  it('should allow an delegate call update', async () => {
    const { account: owner } = ethereum.NewAccount()
    const { account: guest } = ethereum.NewAccount()

    const key = 'delegateUpdateTest'
    const content: { A: number } = {
      A: 1,
    }
    const UpdatedContent: { A: number } = {
      A: 10,
    }

    await client.send({
      account: owner,
      key: key,
      content: content,
      channel: 'TEST',
    })
    await client.send({
      account: owner,
      key: 'security',
      content: {
        authorizations: [
          {
            address: guest.address,
            types: ['AGGREGATE'],
            aggregate_keys: [key],
          },
        ],
      },
      channel: 'security',
    })

    const updated = await client.send<{ A: number }>({
      account: guest,
      address: owner.address,
      key: key,
      content: UpdatedContent,
      channel: 'TEST',
    })
    const message = await client.get<{ A: number }>({
      address: owner.address,
      keys: [key],
    })

    const expected = {
      A: 10,
    }

    expect(message).toStrictEqual(expected)
    expect(message).toStrictEqual(updated.content.content)
  })
})
