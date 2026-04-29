import { hephAccount } from './hephAccount'

describe('hephAccount', () => {
  it('returns the heph deterministic account at index 0', () => {
    const account = hephAccount(0)
    expect(account.address).toBe('0x34f382eeb74De6A1906f7Cb4759B4860B33c5dF3')
  })

  it('returns the heph deterministic account at index 9', () => {
    const account = hephAccount(9)
    expect(account.address).toBe('0xAfaCeB8efeD56ED9fAf8C575021E7871cEEcdA5F')
  })

  it('defaults to index 0', () => {
    expect(hephAccount().address).toBe('0x34f382eeb74De6A1906f7Cb4759B4860B33c5dF3')
  })

  it('throws for an out-of-range index', () => {
    expect(() => hephAccount(10)).toThrow(/out of range/)
    expect(() => hephAccount(-1)).toThrow(/out of range/)
  })
})
