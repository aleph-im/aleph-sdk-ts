import { SuperfluidAccount, createFromEVMAccount } from '../src'
import { ethers } from 'ethers'
import { JsonRPCWallet } from '../../evm/src'
import { AvalancheAccount } from '../../avalanche/src'
import { BaseAccount } from '@aleph-sdk/base'
import { findChainDataByChainId, RpcId } from '../../evm/src/provider'

describe('SuperfluidAccount', () => {
  let avalancheAccountMock: AvalancheAccount
  let baseAccountMock: BaseAccount
  let superfluidAccount: SuperfluidAccount

  beforeEach(async () => {
    const avaxRpcUrl = findChainDataByChainId(RpcId.AVAX)?.rpcUrls[0]
    avalancheAccountMock = {
      wallet: new JsonRPCWallet(new ethers.providers.JsonRpcProvider(avaxRpcUrl)),
      address: '0xTestAddress',
      publicKey: 'TestPublicKey',
      keyPair: undefined,
    } as unknown as AvalancheAccount

    const baseRpcUrl = findChainDataByChainId(RpcId.BASE)?.rpcUrls[0]
    baseAccountMock = {
      wallet: new JsonRPCWallet(new ethers.providers.JsonRpcProvider(baseRpcUrl)),
      address: '0xTestAddress',
      publicKey: 'TestPublicKey',
      keyPair: undefined,
    } as unknown as BaseAccount

    superfluidAccount = new SuperfluidAccount(avalancheAccountMock)
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
    const superfluidAccount = createFromEVMAccount(avalancheAccountMock)
    expect(superfluidAccount).toBeInstanceOf(SuperfluidAccount)
  })

  it('should create Superfluid account from Base account', () => {
    const superfluidAccount = createFromEVMAccount(baseAccountMock)
    expect(superfluidAccount).toBeInstanceOf(SuperfluidAccount)
  })

  it('should fail if account does not have a wallet', () => {
    const accountMock = {
      address: '0xTestAddress',
      publicKey: 'TestPublicKey',
      keyPair: undefined,
    } as unknown as AvalancheAccount

    expect(() => createFromEVMAccount(accountMock)).toThrow('Wallet is required')
  })

  // Add more tests for other functions like "increaseALEPHxFlow", "decreaseALEPHxFlow" etc.
})
