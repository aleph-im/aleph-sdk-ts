import { Blockchain } from '@aleph-sdk/core'
import axios from 'axios'

import * as ethereum from '../../../ethereum/src'
import {
  DEFAULT_SNP_POLICY,
  LaunchMeasurement,
  MAX_MEASUREMENTS,
  MessageType,
  PaymentType,
  TeePlatform,
  VerifiableProgramMessageClient,
  VerifiableProgramPublishConfiguration,
} from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const HEX32 = 'cd'.repeat(32)
const HEX48 = 'ab'.repeat(48)
const RUNTIME_REF = 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe'
const WORKLOAD_REF = 'beefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef'
const HASH_TREE_REF = 'feedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed'

function baseConfig(): Omit<VerifiableProgramPublishConfiguration, 'account'> {
  return {
    channel: 'TEST',
    runtime: { ref: RUNTIME_REF, comment: 'compose-runner snp bundle' },
    workload: { ref: WORKLOAD_REF, hash_tree: HASH_TREE_REF, roothash: HEX32 },
    verification: {
      backend: 'sev_snp',
      measurements: [{ platform: TeePlatform.sev_snp, registers: { launch: HEX48 }, vcpu_type: 'EPYC-v4' }],
    },
  }
}

describe('Test the V-PROGRAM message', () => {
  const client = new VerifiableProgramMessageClient()

  it('publishes a V-PROGRAM message with credit payment and defaults', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })

    const res = await client.send({ account, ...baseConfig() })

    expect(res.type).toBe(MessageType.vProgram)
    expect(res.type).toBe('V-PROGRAM')
    expect(res.content.payment.type).toBe(PaymentType.credit)
    expect(res.content.payment.chain).toBe(Blockchain.ETH)
    expect(res.content.allow_amend).toBe(false)
    expect(res.content.environment).toEqual({ internet: true })
    expect(res.content.resources).toEqual({ vcpus: 1, memory: 128, seconds: 30 })
    expect(res.content.verification.policy).toBe(DEFAULT_SNP_POLICY)
    expect(res.content.verification.measurements[0].registers.launch).toBe(HEX48)
    expect(res.content.volumes).toEqual([])
    expect(res.content.runtime.ref).toBe(RUNTIME_REF)
    expect(res.content.workload.roothash).toBe(HEX32)
    // Unmeasured inputs and amendment channels must never be serialized
    expect(res.content).not.toHaveProperty('variables')
    expect(res.content).not.toHaveProperty('authorized_keys')
    expect(res.content).not.toHaveProperty('replaces')
  })

  it('accepts verified extra volumes and custom resources', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })

    const res = await client.send({
      account,
      ...baseConfig(),
      resources: { vcpus: 2, memory: 2048 },
      environment: { internet: false },
      volumes: [{ ref: WORKLOAD_REF, hash_tree: HASH_TREE_REF, roothash: HEX32, comment: 'model weights' }],
    })

    expect(res.content.resources).toEqual({ vcpus: 2, memory: 2048, seconds: 30 })
    expect(res.content.environment.internet).toBe(false)
    expect(res.content.volumes).toHaveLength(1)
    expect(res.content.volumes[0].comment).toBe('model weights')
  })

  it('rejects non-credit payment', async () => {
    const { account } = ethereum.newAccount()
    await expect(
      client.send({ account, ...baseConfig(), payment: { chain: Blockchain.ETH, type: PaymentType.hold } }),
    ).rejects.toThrow(/credit-only/)
  })

  it('rejects an SNP policy without reserved bit 17', async () => {
    const { account } = ethereum.newAccount()
    const cfg = baseConfig()
    await expect(client.send({ account, ...cfg, verification: { ...cfg.verification, policy: 0x1 } })).rejects.toThrow(
      /bit 17/,
    )
  })

  it('rejects a malformed workload roothash', async () => {
    const { account } = ethereum.newAccount()
    const cfg = baseConfig()
    await expect(
      client.send({ account, ...cfg, workload: { ...cfg.workload, roothash: 'AB'.repeat(32) } }),
    ).rejects.toThrow(/roothash/)
  })

  it('rejects a malformed volume roothash', async () => {
    const { account } = ethereum.newAccount()
    await expect(
      client.send({
        account,
        ...baseConfig(),
        volumes: [{ ref: WORKLOAD_REF, hash_tree: HASH_TREE_REF, roothash: 'zz'.repeat(32) }],
      }),
    ).rejects.toThrow(/volumes\[0\] roothash/)
  })

  it('attaches metadata and requirements when provided, drops them otherwise', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })
    const requirements = { node: { node_hash: RUNTIME_REF } }

    const res = await client.send({ account, ...baseConfig(), metadata: { name: 'vp' }, requirements })

    expect(res.content.metadata).toEqual({ name: 'vp' })
    expect(res.content.requirements).toEqual(requirements)

    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })
    const bare = await client.send({ account, ...baseConfig() })
    expect(bare.content).not.toHaveProperty('metadata')
    expect(bare.content).not.toHaveProperty('requirements')
  })

  it('does not alias the caller measurements array', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })
    const cfg = baseConfig()

    const res = await client.send({ account, ...cfg })
    cfg.verification.measurements.push(cfg.verification.measurements[0])

    expect(res.content.verification.measurements).toHaveLength(1)
    expect(res.content.verification.measurements).not.toBe(cfg.verification.measurements)
  })

  it('rejects a malformed launch register value', async () => {
    const { account } = ethereum.newAccount()
    const cfg = baseConfig()
    await expect(
      client.send({
        account,
        ...cfg,
        verification: {
          ...cfg.verification,
          measurements: [{ platform: TeePlatform.sev_snp, registers: { launch: HEX32 } }],
        },
      }),
    ).rejects.toThrow(/launch/)
  })

  it('rejects missing registers, extra register keys and unknown platforms', async () => {
    const { account } = ethereum.newAccount()
    const cfg = baseConfig()
    const withMeasurements = (measurements: unknown) =>
      client.send({
        account,
        ...cfg,
        verification: { ...cfg.verification, measurements: measurements as LaunchMeasurement[] },
      })
    await expect(withMeasurements([{ platform: 'sev_snp' }])).rejects.toThrow(/registers is required/)
    await expect(
      withMeasurements([{ platform: 'sev_snp', registers: { launch: HEX48, mrtd: HEX48 } }]),
    ).rejects.toThrow(/exactly \{ launch \}/)
    await expect(withMeasurements([{ platform: 'tdx', registers: { launch: HEX48 } }])).rejects.toThrow(
      /unknown TEE platform/,
    )
  })

  it('rejects an unsafe-integer SNP policy', async () => {
    const { account } = ethereum.newAccount()
    const cfg = baseConfig()
    await expect(
      client.send({ account, ...cfg, verification: { ...cfg.verification, policy: 2 ** 60 } }),
    ).rejects.toThrow(/safe integer/)
  })

  it('rejects an empty measurement list', async () => {
    const { account } = ethereum.newAccount()
    const cfg = baseConfig()
    await expect(
      client.send({ account, ...cfg, verification: { ...cfg.verification, measurements: [] } }),
    ).rejects.toThrow(/measurements/)
  })

  it('rejects more than the maximum number of measurements', async () => {
    const { account } = ethereum.newAccount()
    const cfg = baseConfig()
    const measurement = cfg.verification.measurements[0]
    await expect(
      client.send({
        account,
        ...cfg,
        verification: { ...cfg.verification, measurements: Array(MAX_MEASUREMENTS + 1).fill(measurement) },
      }),
    ).rejects.toThrow(/measurements/)
  })

  it('rejects more than the maximum number of verified volumes', async () => {
    const { account } = ethereum.newAccount()
    const volume = { ref: WORKLOAD_REF, hash_tree: HASH_TREE_REF, roothash: HEX32 }
    await expect(client.send({ account, ...baseConfig(), volumes: Array(9).fill(volume) })).rejects.toThrow(/volumes/)
  })

  it('builds a cost-computable message typed V-PROGRAM', async () => {
    const { account } = ethereum.newAccount()
    const msg = await client.getCostComputableMessage({ account, ...baseConfig() })
    expect(msg.type).toBe('V-PROGRAM')
    expect(msg.item_content).toContain('"backend":"sev_snp"')
  })
})
