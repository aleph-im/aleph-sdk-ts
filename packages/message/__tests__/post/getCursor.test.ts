import { v4 as uuidv4 } from 'uuid'

import { delay } from '../../../core/src'
import * as ethereum from '../../../ethereum/src'
import { PostMessageClient, PostResponse } from '../../src'

describe('Post cursor pagination', () => {
  const post = new PostMessageClient()

  it('should return a cursor response with next_cursor field', async () => {
    const res = await post.getCursor({
      channels: ['TEST'],
      pagination: 5,
    })

    expect(Array.isArray(res.posts)).toBe(true)
    expect(res.pagination_per_page).toBe(5)
    expect(res).toHaveProperty('next_cursor')
    expect('pagination_page' in res).toBe(false)
    expect('pagination_total' in res).toBe(false)
  })

  it('should iterate over all posts across multiple pages until next_cursor is null', async () => {
    const { account } = ethereum.newAccount()
    const postType = uuidv4()
    const totalPosts = 5

    const published: string[] = []
    for (let i = 0; i < totalPosts; i++) {
      const res = await post.send({
        channel: 'TEST',
        account,
        postType,
        content: { index: i },
        sync: true,
      })
      published.push(res.item_hash)
    }

    await delay(2000)

    const collected: PostResponse<{ index: number }>[] = []
    for await (const item of post.getAsyncIterator<{ index: number }>({
      types: postType,
      pagination: 2,
    })) {
      collected.push(item)
    }

    expect(collected.length).toBe(totalPosts)
    const collectedHashes = collected.map((p) => p.item_hash).sort()
    expect(collectedHashes).toStrictEqual(published.sort())
  })

  it('should cap pagination at 200', async () => {
    const res = await post.getCursor({
      channels: ['TEST'],
      pagination: 500,
    })

    expect(res.pagination_per_page).toBeLessThanOrEqual(200)
  })
})
