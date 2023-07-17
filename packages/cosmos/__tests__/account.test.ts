import * as cosmos from '../src/account'
import { EphAccount } from '@aleph-sdk/account'
import { Secp256k1HdWallet } from '@cosmjs/amino'

async function createEphemeralCSDK(): Promise<EphAccount> {
  const wallet = await Secp256k1HdWallet.generate()
  const accounts = (await wallet.getAccounts())[0]

  return {
    address: accounts.address,
    publicKey: Buffer.from(accounts.pubkey).toString('hex'),
    mnemonic: wallet.mnemonic,
  }
}

describe('Cosmos accounts', () => {
  let ephemeralAccount: EphAccount

  beforeAll(async () => {
    ephemeralAccount = await createEphemeralCSDK()
  })

  it('should import an cosmos accounts using a mnemonic', async () => {
    const refAccount = await cosmos.NewAccount()
    const cloneAccount = await cosmos.ImportAccountFromMnemonic(refAccount.mnemonic)

    expect(refAccount.account.address).toBe(cloneAccount.address)
  })

  // @todo: Fix this test! We should unit test the cosmos account features, not to send messages to the network and if so, at least mock the backend....

  // it('should publish a post message correctly', async () => {
  //   const { mnemonic } = ephemeralAccount
  //   if (!mnemonic) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')

  //   const account = await cosmos.ImportAccountFromMnemonic(mnemonic)
  //   const content: { body: string } = {
  //     body: 'This message was posted from a cosmos account',
  //   }

  //   const msg = await post.Publish({
  //     account,
  //     APIServer: DEFAULT_API_V2,
  //     channel: 'TEST',
  //     content,
  //     postType: 'cosmos',
  //     storageEngine: ItemType.inline,
  //   })

  //   expect(msg.item_hash).not.toBeUndefined()
  //   setTimeout(async () => {
  //     const amends = await post.Get({
  //       hashes: [msg.item_hash],
  //       types: 'cosmos',
  //     })
  //     expect(amends.posts.length).toBeGreaterThan(0)
  //     // expect(amends.posts[0].content).toStrictEqual(content);
  //   })
  // })
})
