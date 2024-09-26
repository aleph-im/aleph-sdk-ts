import { EphAccount } from '../../account/src'
import * as avalanche from '../../avalanche/src'
import * as base from '../../base/src'
import { createEphemeralEth } from '../../evm/src'
import { createFromEVMAccount, SuperfluidAccount } from '../src'

describe('SuperfluidAccount', () => {
  let ephemeralAccount: EphAccount
  let avalancheAccount: avalanche.AvalancheAccount
  let baseAccount: base.BaseAccount
  let avalancheSuperfluidAccount: SuperfluidAccount
  let baseSuperfluidAccount: SuperfluidAccount

  beforeEach(async () => {
    ephemeralAccount = await createEphemeralEth()

    avalancheAccount = await avalanche.importAccountFromPrivateKey(ephemeralAccount.privateKey)
    baseAccount = await base.importAccountFromPrivateKey(ephemeralAccount.privateKey)

    avalancheSuperfluidAccount = new SuperfluidAccount(avalancheAccount)
    baseSuperfluidAccount = new SuperfluidAccount(baseAccount)
  })

  it('init should setup framework and alephx for Avalanche account', async () => {
    await avalancheSuperfluidAccount.init()

    expect(avalancheSuperfluidAccount).toHaveProperty('framework')
    expect(avalancheSuperfluidAccount).toHaveProperty('alephx')
  })

  it('init should setup framework and alephx for Base account', async () => {
    await baseSuperfluidAccount.init()

    expect(baseSuperfluidAccount).toHaveProperty('framework')
    expect(baseSuperfluidAccount).toHaveProperty('alephx')
  })

  it('should create Superfluid account from Avalanche account', async () => {
    const avaxSuperfluidAccount = await createFromEVMAccount(avalancheAccount)
    expect(avaxSuperfluidAccount).toBeInstanceOf(SuperfluidAccount)
  })

  it('should create Superfluid account from Base account', async () => {
    const baseSuperfluidAccount = await createFromEVMAccount(baseAccount)
    expect(baseSuperfluidAccount).toBeInstanceOf(SuperfluidAccount)
  })

  it('should fail if account does not have a wallet', () => {
    const accountMock = {
      address: '0xTestAddress',
      publicKey: 'TestPublicKey',
      keyPair: undefined,
    } as any

    expect(() => createFromEVMAccount(accountMock)).rejects.toThrow('Wallet is required')
  })

  it('should retrieve ALEPH balance (0) for each account', async () => {
    await avalancheSuperfluidAccount.init()
    await baseSuperfluidAccount.init()

    expect(await avalancheSuperfluidAccount.getALEPHBalance()).toStrictEqual(
      await baseSuperfluidAccount.getALEPHBalance(),
    )
  })

  it('should retrieve ALEPH flow rate (0) for each account', async () => {
    await avalancheSuperfluidAccount.init()
    await baseSuperfluidAccount.init()

    expect(await avalancheSuperfluidAccount.getALEPHFlow(ephemeralAccount.address)).toStrictEqual(
      await baseSuperfluidAccount.getALEPHFlow(ephemeralAccount.address),
    )
  })

  it('increaseALEPHFlow should fail if insufficient ALEPH', async () => {
    await avalancheSuperfluidAccount.init()

    expect(async () => await avalancheSuperfluidAccount.increaseALEPHFlow(ephemeralAccount.address, 1)).rejects.toThrow(
      'Not enough ALEPH to increase flow',
    )
  })

  it('decreaseALEPHFlow should fail if no flow', async () => {
    await avalancheSuperfluidAccount.init()

    expect(async () => await avalancheSuperfluidAccount.decreaseALEPHFlow(ephemeralAccount.address, 1)).rejects.toThrow(
      'No flow to decrease flow',
    )
  })
})
