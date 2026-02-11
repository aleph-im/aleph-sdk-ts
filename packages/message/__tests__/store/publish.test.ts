import { Blockchain } from '@aleph-sdk/core'
import { readFileSync } from 'fs'

import * as ethereum from '../../../ethereum/src'
import { PaymentType, StoreMessageClient } from '../../src'

export function ArraybufferToString(ab: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(ab) as unknown as number[])
}

describe('Store message publish', () => {
  const store = new StoreMessageClient()

  it('should store a file and retrieve it correctly', async () => {
    const { account } = ethereum.newAccount()
    const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')

    const extraFields: Record<string, unknown> = {
      key1: 'value1',
      key2: 123,
    }

    const metadata: Record<string, unknown> = {
      name: 'testFile.txt',
    }

    const hash = await store.send({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
      extraFields,
      metadata,
    })

    const response = await store.download(hash.content.item_hash)

    const got = ArraybufferToString(response)
    const expected = 'y'

    expect(got).toBe(expected)
    expect(hash.content.extra_fields).toEqual(extraFields)
    expect(hash.content.metadata).toEqual(metadata)
  })

  it('should pin a file and retrieve it correctly', async () => {
    const { account } = ethereum.newAccount()
    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'

    const hash = await store.pin({
      channel: 'TEST',
      account: account,
      fileHash: helloWorldHash,
    })

    const response = await store.download(hash.content.item_hash)

    const got = ArraybufferToString(response)
    const expected = 'hello world!'

    expect(got).toBe(expected)
  })

  it('should throw Error to pin a file at runtime', async () => {
    const { account } = ethereum.newAccount()

    const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'

    await expect(
      store.send({
        channel: 'TEST',
        account: account,
        fileHash: helloWorldHash,
      }),
    ).rejects.toThrow('You must choose ipfs to pin the file.')
  })

  it('should calculate the estimated size of a file passing "estimated_size_mib" property', async () => {
    const { account } = ethereum.newAccount()
    const fileContent = readFileSync('./packages/message/__tests__/store/heavyTestFile.txt')

    const cost = await store.getEstimatedCost({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
      estimated_size_mib: 20,
    })

    expect(cost).toBeDefined()
    expect(cost.cost).toBe('6.666666660000000000')
  })

  it('should calculate the estimated size of a file from the fileObject', async () => {
    const { account } = ethereum.newAccount()
    // @note: 1MiB ~file size
    const fileContent = readFileSync('./packages/message/__tests__/store/heavyTestFile.txt')

    const cost = await store.getEstimatedCost({
      channel: 'TEST',
      account: account,
      fileObject: fileContent,
    })

    expect(cost).toBeDefined()
    expect(cost.cost).toBe('0.666666666000000000')
  })

  it('should get the cost of an existing message', async () => {
    const cost = await store.getCost('b6ff5c3a8205d1ca4c7c3369300eeafff498b558f71b851aa2114afd0a532717')

    expect(cost).toBeDefined()
    expect(cost.cost).toBe('108.999999891000000000')
  })

  // TODO: Unskip these tests once the production API supports the new payment schema for STORE messages
  // Payment tests using temporary test endpoint
  describe.skip('Store message payment', () => {
    const storeWithPayment = new StoreMessageClient()

    it('should store a file with hold payment type', async () => {
      const { account } = ethereum.newAccount()
      const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')

      const hash = await storeWithPayment.send({
        channel: 'TEST',
        account: account,
        fileObject: fileContent,
        payment: {
          chain: Blockchain.ETH,
          type: PaymentType.hold,
        },
      })

      expect(hash.content.payment).toBeDefined()
      expect(hash.content.payment?.chain).toBe(Blockchain.ETH)
      expect(hash.content.payment?.type).toBe(PaymentType.hold)
    })

    it('should store a file with credit payment type', async () => {
      const { account } = ethereum.newAccount()
      const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')

      const hash = await storeWithPayment.send({
        channel: 'TEST',
        account: account,
        fileObject: fileContent,
        payment: {
          chain: Blockchain.ETH,
          type: PaymentType.credit,
        },
      })

      expect(hash.content.payment).toBeDefined()
      expect(hash.content.payment?.chain).toBe(Blockchain.ETH)
      expect(hash.content.payment?.type).toBe(PaymentType.credit)
    })

    it('should store a file without payment (defaults to no payment field)', async () => {
      const { account } = ethereum.newAccount()
      const fileContent = readFileSync('./packages/message/__tests__/store/testFile.txt')

      const hash = await storeWithPayment.send({
        channel: 'TEST',
        account: account,
        fileObject: fileContent,
      })

      expect(hash.content.payment).toBeUndefined()
    })

    it('should pin a file with credit payment type', async () => {
      const { account } = ethereum.newAccount()
      const helloWorldHash = 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'

      const hash = await storeWithPayment.pin({
        channel: 'TEST',
        account: account,
        fileHash: helloWorldHash,
        payment: {
          chain: Blockchain.ETH,
          type: PaymentType.credit,
        },
      })

      expect(hash.content.payment).toBeDefined()
      expect(hash.content.payment?.chain).toBe(Blockchain.ETH)
      expect(hash.content.payment?.type).toBe(PaymentType.credit)
    })

    it('should calculate the estimated cost with credit payment type', async () => {
      const { account } = ethereum.newAccount()
      const fileContent = readFileSync('./packages/message/__tests__/store/heavyTestFile.txt')

      const cost = await storeWithPayment.getEstimatedCost({
        channel: 'TEST',
        account: account,
        fileObject: fileContent,
        payment: {
          chain: Blockchain.ETH,
          type: PaymentType.credit,
        },
      })

      expect(cost).toBeDefined()
      expect(cost.payment_type).toBe(PaymentType.credit)
    })
  })
})
