import { ForgetMessageClient, PostMessageClient } from '../../src'
import * as ethereum from '../../../ethereum/src'
import { delay } from '@aleph-sdk/core'

describe('Forget publish tests', () => {
  const postType = 'TS Forget Test'
  const content: { body: string } = { body: 'This message will be destroyed' }
  const post = new PostMessageClient()
  const forget = new ForgetMessageClient()

  it('should post a message which will be forget', async () => {
    const { account } = ethereum.newAccount()

    const res = await post.send({
      channel: 'TEST',
      account: account,
      postType: postType,
      content: content,
    })

    const Fres = await forget.send({
      channel: 'TEST',
      hashes: [res.item_hash],
      account: account,
    })
    expect(Fres.content).not.toBeNull()
  })

  it('Forget a message using storage engine', async () => {
    const { account } = ethereum.newAccount()
    const postRest = await post.send({
      channel: 'TEST',
      account: account,
      postType: postType,
      content: content,
    })

    const forgetRes = await forget.send({
      channel: 'TEST',
      hashes: [postRest.item_hash],
      account: account,
    })

    await delay(1000)

    const initialPost = await post.getAll({ types: postType, hashes: [postRest.item_hash] })

    expect(forgetRes.content).not.toBeNull()
    expect(initialPost.posts.length).toStrictEqual(0)
  })
})
