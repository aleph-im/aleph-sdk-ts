import { AggregateMessageClient } from '../../src'
import { MessageNotFoundError } from '../../src/types/errors'
import { hephAccount } from '../_helpers/hephAccount'

// Well-known Aleph protocol address for the CCN registry. Heph initializes
// the corechannel aggregate at this address, matching mainnet convention.
const ALEPH_CORECHANNEL_ADDRESS = '0xa1B3bb7d2332383D96b7796B908fB7f7F3c2Be10'

describe('Aggregate message retrieve test', () => {
  const client = new AggregateMessageClient()

  it('should fail to retrieve a non-existent aggregate', async () => {
    try {
      await client.get({
        address: hephAccount(0).address,
        keys: ['satoshi'],
      })
    } catch (e: any) {
      expect(e instanceof MessageNotFoundError).toStrictEqual(true)
    }
  })

  it('should print the CCN list correctly (testing #87)', async () => {
    const message = await client.get({
      address: ALEPH_CORECHANNEL_ADDRESS,
      keys: ['corechannel'],
    })

    expect(message).toHaveProperty('corechannel')
  })
})
