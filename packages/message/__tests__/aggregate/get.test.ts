import { AggregateMessageClient } from '../../src'
import { MessageNotFoundError } from '../../src/types/errors'

describe('Aggregate message retrieve test', () => {
  const client = new AggregateMessageClient()
  it('should failed to retrieve an aggregate message', async () => {
    try {
      await client.get({
        address: '0xa1B3bb7d2332383D96b7796B908fB7f7F3c2Be10',
        keys: ['satoshi'],
      })
      expect(true).toStrictEqual(false)
    } catch (e: any) {
      expect(e instanceof MessageNotFoundError).toStrictEqual(true)
    }
  })

  it('should print the CCN list correctly (testing #87)', async () => {
    const message = await client.get({
      address: '0xa1B3bb7d2332383D96b7796B908fB7f7F3c2Be10',
      keys: ['corechannel'],
    })

    expect(message).toHaveProperty('corechannel')
  })
})
