import { aggregate, ethereum, post } from '../../index'
import { v4 as uuidv4 } from 'uuid'
import { EphAccountList } from '../../testAccount/entryPoint'
import fs from 'fs'

describe('Post publish tests', () => {
  let ephemeralAccount: EphAccountList

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    if (!fs.existsSync('./tests/testAccount/ephemeralAccount.json'))
      throw Error('[Ephemeral Account Generation] - Error, please run: npm run test:regen')
    ephemeralAccount = await import('../../testAccount/ephemeralAccount.json')
    if (!ephemeralAccount.eth.privateKey) throw Error('[Ephemeral Account Generation] - Generated Account corrupted')
  })

  it('should amend post message correctly', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)
    const postType = uuidv4()
    const content: { body: string } = {
      body: 'Hello World',
    }

    const oldPost = await post.Publish({
      channel: 'TEST',
      account: account,
      postType: postType,
      content: content,
    })

    content.body = 'New content !'
    const amended = await post.Publish({
      channel: 'TEST',
      account: account,
      postType: 'amend',
      content: content,
      ref: oldPost.item_hash,
    })

    setTimeout(async () => {
      const amends = await post.Get({
        types: 'amend',
        hashes: [amended.item_hash],
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
    if (!ephemeralAccount.eth.privateKey || !ephemeralAccount.eth1.privateKey)
      throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

    const owner = ethereum.ImportAccountFromPrivateKey(ephemeralAccount.eth.privateKey)
    const guest = ethereum.ImportAccountFromPrivateKey(ephemeralAccount.eth1.privateKey)

    const originalPost = await post.Publish({
      channel: 'TEST',
      account: owner,
      postType: 'testing_delegate',
      content: { body: 'First content' },
    })

    await aggregate.Publish({
      account: owner,
      key: 'security',
      content: {
        authorizations: [
          {
            address: guest.address,
            types: ephemeralAccount.security.types,
            aggregate_keys: ephemeralAccount.security.aggregate_keys,
          },
        ],
      },
      channel: 'security',
    })

    await post.Publish({
      channel: 'TEST',
      account: guest,
      address: owner.address,
      postType: 'amend',
      content: { body: 'First content updated' },
      ref: originalPost.item_hash,
    })

    const amends = await post.Get({
      types: 'testing_delegate',
      hashes: [originalPost.item_hash],
    })
    expect(amends.posts[0].content).toStrictEqual({ body: 'First content updated' })
  })

  it('should automatically switch between inline and Aleph Storage due to the message size', async () => {
    const { account } = ethereum.NewAccount()

    const postRes = await post.Publish({
      channel: 'TEST',
      account: account,
      postType: 'testing_oversize',
      content: { body: Buffer.alloc(60 * 2 ** 10, 'a').toString() },
    })

    expect(postRes.item_type).toStrictEqual('storage')
  })
})
