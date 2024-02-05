import fs, { readFileSync } from 'fs'
import { ethereum, program } from '../../index'
import { EphAccountList } from '../../testAccount/entryPoint'

export function ArraybufferToString(ab: ArrayBuffer): string {
  return new TextDecoder().decode(ab)
}

describe('Test the program message', () => {
  let ephemeralAccount: EphAccountList

  // Import the List of Test Ephemeral test Account, throw if the list is not generated
  beforeAll(async () => {
    if (!fs.existsSync('./tests/testAccount/ephemeralAccount.json'))
      throw Error('[Ephemeral Account Generation] - Error, please run: npm run test:regen')
    ephemeralAccount = await import('../../testAccount/ephemeralAccount.json')
    if (!ephemeralAccount.eth.privateKey) throw Error('[Ephemeral Account Generation] - Generated Account corrupted')
  })

  it('Publish a program retrieve the message', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)

    const fileContent = readFileSync('./tests/messages/program/main.py.zip')

    const res = await program.publish({
      account: account,
      channel: 'TEST',
      file: fileContent,
      entrypoint: 'main:app',
    })

    expect(res.content.code.entrypoint).toBe('main:app')
    expect(res.content.address).toBe(account.address)
  })

  it('Spawn a program', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)

    const res = await program.Spawn({
      account: account,
      channel: 'TEST',
      entrypoint: 'main:app',
      programRef: '560506e91349712a8338440c0df3c74c17d1b797183ffc34797887d1d4470130',
    })

    expect(res.content.code.entrypoint).toBe('main:app')
    expect(res.content.address).toBe(account.address)
  })

  it('Spawn a persistent program', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)

    const res = await program.Spawn({
      account: account,
      channel: 'TEST',
      isPersistent: true,
      entrypoint: 'main:app',
      programRef: '560506e91349712a8338440c0df3c74c17d1b797183ffc34797887d1d4470130',
    })

    expect(res.content.code.entrypoint).toBe('main:app')
    expect(res.content.address).toBe(account.address)
  })

  it('Spawn a program with custom metadata', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)

    const res = await program.Spawn({
      account: account,
      channel: 'TEST',
      entrypoint: 'main:app',
      programRef: '560506e91349712a8338440c0df3c74c17d1b797183ffc34797887d1d4470130',
      metadata: {
        name: 'My program',
        description: 'My program description',
      },
    })

    expect(res.content.code.entrypoint).toBe('main:app')
    expect(res.content.address).toBe(account.address)
    expect(res.content?.metadata?.name).toBe('My program')
  })

  it('Should fail to Spawn a program', async () => {
    const { mnemonic } = ephemeralAccount.eth
    if (!mnemonic) throw Error('Can not retrieve mnemonic inside ephemeralAccount.json')
    const account = ethereum.ImportAccountFromMnemonic(mnemonic)

    await expect(
      program.Spawn({
        account: account,
        channel: 'TEST',
        entrypoint: 'main:app',
        programRef: 'unknown_program',
      }),
    ).rejects.toThrow('The program ref: unknown_program does not exist on Aleph network')
  })
})
