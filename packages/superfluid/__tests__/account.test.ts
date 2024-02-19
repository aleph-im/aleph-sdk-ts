// superfluidAccount.test.ts
import { SuperfluidAccount, createFromAvalancheAccount } from '../'
import { ethers, providers } from 'ethers'
import { JsonRPCWallet } from '../../evm'
import { AvalancheAccount } from '@aleph-sdk/avalanche'

// Mocks
jest.mock('@aleph-sdk/evm')
jest.mock('@aleph-sdk/avalanche')
jest.mock('ethers')
jest.mock('@superfluid-finance/sdk-core')

describe('SuperfluidAccount', () => {
  let superfluidAccount: SuperfluidAccount
  let mockProvider: providers.JsonRpcProvider

  beforeEach(() => {
    mockProvider = new providers.JsonRpcProvider()
    const wallet = new JsonRPCWallet(mockProvider)
    superfluidAccount = new SuperfluidAccount(wallet, 'testAddress', 'testPublicKey')
  })

  it('init should setup framework and alephx', async () => {
    await superfluidAccount.init()

    expect(superfluidAccount).toHaveProperty('framework')
    expect(superfluidAccount).toHaveProperty('alephx')
  })

  it('getALEPHBalance should return 0 for unimplemented method', async () => {
    const balance = await superfluidAccount.getALEPHBalance()
    expect(balance.toNumber()).toEqual(0)
  })

  it('should create Superfluid account from Avalanche account', () => {
    const rpcUrl = 'http://localhost:8545'
    const avalancheAccountMock = {
      wallet: new JsonRPCWallet(new ethers.providers.JsonRpcProvider(rpcUrl)),
      address: '0xTestAddress',
      publicKey: 'TestPublicKey',
      keyPair: undefined,
    } as unknown as AvalancheAccount

    const superfluidAccount = createFromAvalancheAccount(avalancheAccountMock, rpcUrl)
    expect(superfluidAccount).toBeInstanceOf(SuperfluidAccount)
  })

  it('should fail if Avalanche account does not have a wallet', () => {
    const avalancheAccountMock = {
      address: '0xTestAddress',
      publicKey: 'TestPublicKey',
      keyPair: undefined,
    } as unknown as AvalancheAccount

    expect(() => createFromAvalancheAccount(avalancheAccountMock)).toThrow('Wallet is required')
  })

  // Add more tests for other functions like "increaseALEPHxFlow", "decreaseALEPHxFlow" etc.
})
