import { ProgramMessageClient } from '../../src'
import * as ethereum from '../../../ethereum/src'
import { readFileSync } from 'fs'

describe('Test the program message', () => {
  const program = new ProgramMessageClient()

  it('Publish a program retrieve the message', async () => {
    const { account } = ethereum.newAccount()

    const fileContent = readFileSync('./packages/message/__tests__/program/main.py.zip')

    const res = await program.send({
      account: account,
      channel: 'TEST',
      file: fileContent,
      entrypoint: 'main:app',
    })

    expect(res.content.code.entrypoint).toBe('main:app')
    expect(res.content.address).toBe(account.address)
  })

  it('Spawn a program', async () => {
    const { account } = ethereum.newAccount()

    const res = await program.send({
      account: account,
      channel: 'TEST',
      entrypoint: 'main:app',
      programRef: '560506e91349712a8338440c0df3c74c17d1b797183ffc34797887d1d4470130',
    })

    expect(res.content.code.entrypoint).toBe('main:app')
    expect(res.content.address).toBe(account.address)
  })

  it('Spawn a persistent program', async () => {
    const { account } = ethereum.newAccount()

    const res = await program.send({
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
    const { account } = ethereum.newAccount()

    const res = await program.send({
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
    const { account } = ethereum.newAccount()

    await expect(
      program.send({
        account: account,
        channel: 'TEST',
        entrypoint: 'main:app',
        programRef: 'unknown_program',
      }),
    ).rejects.toThrow('The program ref: unknown_program does not exist on Aleph network')
  })
})
