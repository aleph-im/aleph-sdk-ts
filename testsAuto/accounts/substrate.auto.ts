import * as bip39 from 'bip39'
import assert from 'assert'
import { mnemonicToMiniSecret } from '@polkadot/util-crypto'

import { testsFunc } from '../index'
import { accounts, messages } from '../../src'
import { Chain } from '../../src/messages/types'
import fs from 'fs'

/**
 * This is the first test of the test bach for substrate.
 * It should create a new substrate account and check if it worked.
 *
 * For the assertion comparison, the `assert` standard library is used.
 * If the assertion failed, you must catch the error message and display it while returning false.
 */
async function createAccountTest(): Promise<boolean> {
  const { account, mnemonic } = await accounts.substrate.NewAccount()
  const accountFromMnemonic = await accounts.substrate.ImportAccountFromMnemonic(mnemonic)

  try {
    assert.strictEqual(account.address, accountFromMnemonic.address)
    assert.strictEqual(account.GetChain(), Chain.DOT)
  } catch (e: unknown) {
    console.error(`createAccountTest: ${e}`)
    return false
  }
  return true
}

async function importAccountFromPrivateKeyTest(): Promise<boolean> {
  const mnemonic = bip39.generateMnemonic()
  const account = await accounts.substrate.ImportAccountFromMnemonic(mnemonic)
  const secretKey = `0x${Buffer.from(mnemonicToMiniSecret(mnemonic)).toString('hex')}`
  const importedAccount = await accounts.substrate.ImportAccountFromPrivateKey(secretKey)

  try {
    assert.strictEqual(account.address, importedAccount.address)
  } catch (e: unknown) {
    console.error(`importAccountFromPrivateKeyTest: ${e}`)
    return false
  }
  return true
}

async function PublishAggregate(): Promise<boolean> {
  if (!fs.existsSync('tests/testAccount/ephemeralAccount.json'))
    throw Error('[Ephemeral Account Generation] - Error, please run: npm run test:regen')
  const ephemeralAccount = await import('@aleph-sdk/account/tests/testAccount/ephemeralAccount.json')
  if (!ephemeralAccount.avax.privateKey) throw Error('[Ephemeral Account Generation] - Generated Account corrupted')

  const { mnemonic } = ephemeralAccount.polkadot
  if (!mnemonic) throw Error('Can not retrieve privateKey inside ephemeralAccount.json')
  const account = await accounts.substrate.ImportAccountFromMnemonic(mnemonic)
  const key = 'cheer'
  const content: { body: string } = {
    body: 'Typescript sdk',
  }

  await messages.aggregate.Publish({
    account: account,
    key: key,
    content: content,
    channel: 'TEST',
  })

  type exceptedType = {
    cheer: {
      body: string
    }
  }
  const amends = await messages.aggregate.Get<exceptedType>({
    address: account.address,
    keys: [key],
  })

  try {
    assert.strictEqual(amends.cheer.body, content.body)
  } catch (e: unknown) {
    console.error(`PublishPostMessage: ${e}`)
    return false
  }
  return true
}

async function encryptNDecrypt(): Promise<boolean> {
  const account = await accounts.substrate.ImportAccountFromMnemonic(
    'immune orbit beyond retire marble clog shiver ice illegal tomorrow antenna tennis',
  )
  const msg = Buffer.from('Innovation')

  try {
    const c = account.encrypt(msg)
    const d = account.decrypt(c)
    assert.notStrictEqual(c, msg)
    assert.deepEqual(d, msg)
  } catch (e: unknown) {
    console.error(`encryptNDecrypt: ${e}`)
    return false
  }
  return true
}

/**
 * SubstrateTests controls the flow of your custom tests for substrate protocol.
 * Every test is represented by a function related to the `testsFunc` Type.
 * The array `testBatch` Contains all the customs tests functions in a predefined order.
 *
 * Every test will be executed in order, then a boolean according to the failure or success of your batch
 * will be returned.
 *
 * In order to produce a new test bach you have to copy this function in a new file with
 * an appropriate name, import `assert` library and `testsFunc` type.
 */
export default async function substrateTests(): Promise<boolean> {
  let passed = true
  let res: boolean
  const testBatch: testsFunc[] = [createAccountTest, importAccountFromPrivateKeyTest, PublishAggregate, encryptNDecrypt]

  for (let i = 0; i < testBatch.length; i++) {
    res = await testBatch[i]()
    console.log(`Test [${i + 1}-${res ? 'Success' : 'Failure'}]\t${testBatch[i].name}`)
    passed = res ? passed : false
  }
  return passed
}
