import { aggregate } from '@aleph-sdk/account/tests'
import { DEFAULT_API_V2 } from '../../../src/global'

describe('Aggregate message retrieve test', () => {
  it('should failed to retrieve an aggregate message', async () => {
    try {
      await aggregate.Get({
        APIServer: DEFAULT_API_V2,
        address: '0xa1B3bb7d2332383D96b7796B908fB7f7F3c2Be10',
        keys: ['satoshi'],
      })
      expect(true).toStrictEqual(false)
    } catch (e: any) {
      expect(e.request.res.statusCode).toStrictEqual(404)
    }
  })

  it('should print the CCN list correctly (testing #87)', async () => {
    const message = await aggregate.Get({
      address: '0xa1B3bb7d2332383D96b7796B908fB7f7F3c2Be10',
      keys: ['corechannel'],
    })

    expect(message).toHaveProperty('corechannel')
  })
})
