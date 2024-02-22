import { PostMessageClient, AggregateMessageClient } from '../../src'
import { v4 as uuidv4 } from 'uuid'
import * as ethereum from '../../../ethereum/src'
import { delay } from '../../../core/src'

describe('Post publish tests', () => {
  const post = new PostMessageClient()
  const aggregate = new AggregateMessageClient()

  it('should amend post message correctly', async () => {
    const { account } = ethereum.newAccount()
    const postType = uuidv4()
    const content: { body: string } = {
      body: 'Hello World',
    }

    const oldPost = await post.send({
      channel: 'TEST',
      account: account,
      postType: postType,
      content: content,
    })

    content.body = 'New content !'
    const amended = await post.send({
      channel: 'TEST',
      account: account,
      postType: 'amend',
      content: content,
      ref: oldPost.item_hash,
    })

    expect(amended.content.content).toStrictEqual(content)

    await delay(1000)

    setTimeout(async () => {
      const amends = await post.getAll({
        hashes: [oldPost.item_hash],
      })
      expect(amends.posts[0].content).toStrictEqual(content)
    })
  })

  /**
   * This Test is about delegation
   * All value dedicated for the security configuration have to be specified here:
   * createSecurityConfig() inside tests/testAccount/generateAccounts.ts
   */
  it('should delegate amend post message correctly', async () => {
    const { account: owner } = ethereum.newAccount()
    const { account: guest } = ethereum.newAccount()

    const originalPost = await post.send({
      channel: 'TEST',
      account: owner,
      postType: 'testing_delegate',
      content: { body: 'First content' },
    })

    await aggregate.send({
      account: owner,
      key: 'security',
      content: {
        authorizations: [
          {
            address: guest.address,
            types: ['POST'],
          },
        ],
      },
      channel: 'security',
    })

    await delay(1000)

    await post.send({
      channel: 'TEST',
      account: guest,
      address: owner.address,
      postType: 'amend',
      content: { body: 'First content updated' },
      ref: originalPost.item_hash,
    })

    await delay(1000)

    const amends = await post.getAll({
      types: 'testing_delegate',
      hashes: [originalPost.item_hash],
    })
    expect(amends.posts[0].content).toStrictEqual({ body: 'First content updated' })
  })

  it('should automatically switch between inline and Aleph Storage due to the message size', async () => {
    const { account } = ethereum.newAccount()

    const postRes = await post.send({
      channel: 'TEST',
      account: account,
      postType: 'testing_oversize',
      content: { body: Buffer.alloc(60 * 2 ** 10, 'a').toString() },
    })

    expect(postRes.item_type).toStrictEqual('storage')
  })
})
