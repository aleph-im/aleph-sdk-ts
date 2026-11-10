import { cb58Decode, cb58Encode, KeyPair, recoverPublicKey } from '../src/keypair'

const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000001'
const PUBLIC_KEY = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
const X_ADDRESS = 'X-avax1w508d6qejxtdg4y5r3zarvary0c5xw7k0l6nk9'
const FUJI_ADDRESS = 'X-fuji1w508d6qejxtdg4y5r3zarvary0c5xw7krd7v66'
const PRIVATE_KEY_STRING = 'PrivateKey-1111111111111111111111111111111DxAh4Y'
const PUBLIC_KEY_STRING = '5p78kHbL33Rn3JWkTWRE2B9uz6gy4r1KbfAKLNQGE3ovHLnVJK'
const SIGNATURE =
  'e6b839ff5ec29498b4deab9951b8079154880dc35555f0a83a91f40d93f4869f7700b832084ed46ea5e2ffabc49e31c9639dadba96ab9ec01da74670dd2558c800'

function keypair(hrp = 'avax', chain = 'X'): KeyPair {
  const pair = new KeyPair(hrp, chain)
  pair.importKey(Buffer.from(PRIVATE_KEY, 'hex'))
  return pair
}

describe('Avalanche keypair', () => {
  it('should encode and decode cb58 values', () => {
    const bytes = Buffer.from([0, 1, 2, 3])

    expect(cb58Encode(bytes)).toBe('13DV5cZ86B')
    expect(cb58Decode('13DV5cZ86B').toString('hex')).toBe(bytes.toString('hex'))
  })

  it('should reject invalid cb58 checksums', () => {
    expect(() => cb58Decode('13DV5cZ86C')).toThrow('Invalid cb58 checksum')
  })

  it('should generate the expected public key and addresses', () => {
    expect(keypair().getPublicKey().toString('hex')).toBe(PUBLIC_KEY)
    expect(keypair().getAddressString()).toBe(X_ADDRESS)
    expect(keypair('fuji').getAddressString()).toBe(FUJI_ADDRESS)
    expect(keypair().getPrivateKeyString()).toBe(PRIVATE_KEY_STRING)
    expect(keypair().getPublicKeyString()).toBe(PUBLIC_KEY_STRING)
  })

  it('should sign and recover the public key', () => {
    const pair = keypair()
    const message = Buffer.from('aleph')
    const signature = pair.sign(message)

    expect(signature.toString('hex')).toBe(SIGNATURE)
    expect(pair.verify(message, signature)).toBe(true)
    expect(recoverPublicKey(message, signature).toString('hex')).toBe(PUBLIC_KEY)
    expect(pair.recover(message, signature).toString('hex')).toBe(PUBLIC_KEY)
  })
})
