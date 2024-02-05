import { ethereum, avalanche, nuls2 } from '../index'

describe('EciesAccount accounts', () => {
  it('Should test a ETH-AVAX message encryption', async () => {
    const accountA = ethereum.NewAccount()
    const accountB = await avalanche.NewAccount()
    const msg = Buffer.from('Innovation')

    const c = await accountA.account.encrypt(msg, accountB.account)
    const d = await accountB.account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('Should test a AVAX-ETH message encryption', async () => {
    const accountA = await avalanche.NewAccount()
    const accountB = ethereum.NewAccount()
    const msg = Buffer.from('Innovation')

    const c = await accountA.account.encrypt(msg, accountB.account)
    const d = await accountB.account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })

  it('Should test an ETH-NULS2 message encryption', async () => {
    const accountA = ethereum.NewAccount()
    const accountB = await nuls2.NewAccount()
    const msg = Buffer.from('Innovation')

    const c = await accountA.account.encrypt(msg, accountB.account)
    const d = await accountB.account.decrypt(c)
    expect(c).not.toBe(msg)
    expect(d).toStrictEqual(msg)
  })
})
