import { v4 as uuidv4 } from 'uuid'

import { delay } from '../../../core/src'
import { PostMessageClient } from '../../src'
import { hephAccount } from '../_helpers/hephAccount'

describe('Post get tests', () => {
  const post = new PostMessageClient()
  const account = hephAccount(0)
  let seededHash: string
  let seededType: string
  const seededContent = { body: 'New content !' }

  beforeAll(async () => {
    seededType = uuidv4()
    const res = await post.send({
      channel: 'TEST',
      account,
      postType: seededType,
      content: seededContent,
      sync: true,
    })
    seededHash = res.item_hash
    await delay(1000)
  })

  it('should only get post from a specific channel', async () => {
    const channel = 'TEST'

    const amends = await post.getAll({
      types: [],
      pagination: 5,
      channels: [channel],
    })

    expect(amends.posts.length).toBeGreaterThan(0)
    amends.posts.map((post) => {
      expect(post.channel).toStrictEqual(channel)
    })
  })

  it('should get a post with specific parameters', async () => {
    const amends = await post.getAll({
      addresses: [account.address],
      hashes: [seededHash],
    })

    expect(amends.posts[0].content).toStrictEqual(seededContent)
  })
})
