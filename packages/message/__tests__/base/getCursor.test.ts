import { v4 as uuidv4 } from 'uuid'

import { delay } from '../../../core/src'
import * as ethereum from '../../../ethereum/src'
import { BaseMessageClient, MessageContent, PostMessageClient, PublishedMessage } from '../../src'

describe('Message cursor pagination', () => {
  const messageClient = new BaseMessageClient()
  const postClient = new PostMessageClient()

  it('should return a cursor response with next_cursor field', async () => {
    const res = await messageClient.getCursor({
      channels: ['TEST'],
      pagination: 5,
    })

    expect(Array.isArray(res.messages)).toBe(true)
    expect(res.pagination_per_page).toBe(5)
    expect(res).toHaveProperty('next_cursor')
    expect('pagination_page' in res).toBe(false)
    expect('pagination_total' in res).toBe(false)
  })

  it('should iterate over all messages from a sender across multiple pages', async () => {
    const { account } = ethereum.newAccount()
    const postType = uuidv4()
    const totalPosts = 5

    const published: string[] = []
    for (let i = 0; i < totalPosts; i++) {
      const res = await postClient.send({
        channel: 'TEST',
        account,
        postType,
        content: { index: i },
        sync: true,
      })
      published.push(res.item_hash)
    }

    await delay(2000)

    const collected: PublishedMessage<MessageContent>[] = []
    for await (const message of messageClient.getAsyncIterator({
      addresses: [account.address],
      pagination: 2,
    })) {
      collected.push(message)
    }

    expect(collected.length).toBe(totalPosts)
    const collectedHashes = collected.map((m) => m.item_hash).sort()
    expect(collectedHashes).toStrictEqual(published.sort())
  })

  it('should cap pagination at 200', async () => {
    const res = await messageClient.getCursor({
      channels: ['TEST'],
      pagination: 500,
    })

    expect(res.pagination_per_page).toBeLessThanOrEqual(200)
  })
})
