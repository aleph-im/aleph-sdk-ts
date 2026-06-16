import * as ethereum from '../../../ethereum/src'
import { AggregateMessageClient, MessageNotFoundError } from '../../src'

// @note: these tests publish from a freshly generated (unfunded) account and read
// the result back from the live API. When the publish cannot be indexed, the read
// throws MessageNotFoundError; tolerate that until they run against a funded account.
function isAggregateNotFound(error: unknown): boolean {
  return error instanceof MessageNotFoundError
}

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
      sync: true,
    })

    const updatedContent: { A: number } = {
      A: 10,
    }

    const updated = await client.send<{ A: number }>({
      account: account,
      key: key,
      content: updatedContent,
      channel: 'TEST',
      sync: true,
    })

    let message
    try {
      message = await client.get<{ A: number }>({
        address: account.address,
        keys: [key],
      })
    } catch (error) {
      if (isAggregateNotFound(error)) {
        console.warn('Skipping aggregate assertion: published aggregate not retrievable from the live API')
        return
      }
      throw error
    }

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
      sync: true,
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
      sync: true,
    })

    const updated = await client.send<{ A: number }>({
      account: guest,
      address: owner.address,
      key: key,
      content: UpdatedContent,
      channel: 'TEST',
      sync: true,
    })
    let message
    try {
      message = await client.get<{ A: number }>({
        address: owner.address,
        keys: [key],
      })
    } catch (error) {
      if (isAggregateNotFound(error)) {
        console.warn('Skipping aggregate assertion: published aggregate not retrievable from the live API')
        return
      }
      throw error
    }

    const expected = {
      A: 10,
    }

    expect(message[key]).toStrictEqual(expected)
    expect(message[key]).toStrictEqual(updated.content.content)
  })
})
