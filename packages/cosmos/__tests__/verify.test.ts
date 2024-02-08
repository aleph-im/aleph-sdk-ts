// verify.test.ts in cosmos package

import { verifyCosmos } from '@aleph-sdk/cosmos'

describe('verifyCosmos', () => {
  it('should throw an error if message has no GetVerificationBuffer method and is not a Buffer', async () => {
    const message = {}

    await expect(verifyCosmos(message as any, 'fake_signature')).rejects.toThrow(
      "message doesn't have a valid GetVerificationBuffer method",
    )
  })

  it('should return false if the public key type is not supported', async () => {
    const message = Buffer.from('test message')
    const serializedSignature = JSON.stringify({
      signature: 'fake_signature',
      pub_key: { type: 'unsupported_key_type', value: 'fake_value' },
    })

    const result = await verifyCosmos(message, serializedSignature)
    expect(result).toBe(false)
  })

  // More tests could include verifying a correct signature, incorrect signature, etc.
})
