import * as ethereum from '../../../ethereum/src'
import { AggregateMessageClient } from '../../src'
import { delay } from '@aleph-sdk/core'

describe('Aggregate message update test', () => {
  const client = new AggregateMessageClient()

  it('should publish and update an aggregate message', async () => {
    const { account } = ethereum.newAccount()
    const key = 'updateTest'

    const content: { A: number } = {
      A: 1,
    }

    await client.send<{ A: number }>({
      account: account,
      key: key,
      content: content,
      channel: 'TEST',
    })

    const updatedContent: { A: number } = {
      A: 10,
    }

    const updated = await client.send<{ A: number }>({
      account: account,
      key: key,
      content: updatedContent,
      channel: 'TEST',
    })

    await delay(1000)

    const message = await client.get<{ A: number }>({
      address: account.address,
      keys: [key],
    })

    const expected = {
      [key]: updatedContent,
    }

    expect(message).toStrictEqual(expected)
    expect(message[key]).toStrictEqual(updated.content.content)
  })

  /**
   * This Test is about delegation
   * All value dedicated for the security configuration have to be specified here:
   * createSecurityConfig() inside tests/testAccount/generateAccounts.ts
   */
  it('should allow an delegate call update', async () => {
    const { account: owner } = ethereum.newAccount()
    const { account: guest } = ethereum.newAccount()

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

    expect(message[key]).toStrictEqual(expected)
    expect(message[key]).toStrictEqual(updated.content.content)
  })
})
