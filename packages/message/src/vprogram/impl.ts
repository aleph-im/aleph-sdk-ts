import { Blockchain, DEFAULT_API_V2 } from '@aleph-sdk/core'

import {
  LaunchMeasurement,
  TeePlatform,
  TeeVerification,
  VerifiableProgramContent,
  VerifiableProgramPublishConfiguration,
  VerifiedVolume,
  VerifiedWorkload,
} from './types'
import { ItemType, MessageType, PaymentType, VerifiableProgramMessage } from '../types'
import { DefaultMessageClient } from '../utils/base'
import {
  DEFAULT_SNP_POLICY,
  defaultResources,
  defaultVerifiableProgramEnvironment,
  MAX_MEASUREMENTS,
  MAX_VERIFIED_VOLUMES,
  SNP_POLICY_RESERVED_BIT_17,
} from '../utils/constants'
import { buildMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'

// sha256 dm-verity root hash, as printed by veritysetup format
const VERITY_ROOTHASH_PATTERN = /^[0-9a-f]{64}$/
// Every pinned SEV-SNP register is a 48-byte SHA-384 value
const REGISTER_VALUE_PATTERN = /^[0-9a-f]{96}$/

/**
 * Throws if the value is not a plausible SEV-SNP guest policy.
 * Mirrors aleph_message.models.execution.environment.validate_snp_policy.
 */
export function validateSnpPolicy(policy: number): void {
  // The policy is a 64-bit value on the wire, but it travels as a JSON number
  // (BigInt does not serialize), so only safe integers (< 2^53) are accepted.
  if (!Number.isSafeInteger(policy) || policy < 0) {
    throw new Error(`SEV-SNP guest policy must be a non-negative safe integer (below 2^53, JSON number); got ${policy}`)
  }
  // Use BigInt: bitwise operators on numbers truncate to 32 bits.
  if ((BigInt(policy) & SNP_POLICY_RESERVED_BIT_17) === 0n) {
    throw new Error(
      `SEV-SNP guest policy must have reserved bit 17 set (e.g. 0x${DEFAULT_SNP_POLICY.toString(16)}); got 0x${policy.toString(16)}. ` +
        'Note that SEV policy bit semantics do not apply to SEV-SNP.',
    )
  }
}

function validateVerityRef(value: VerifiedWorkload, what: string): void {
  if (!VERITY_ROOTHASH_PATTERN.test(value.roothash)) {
    throw new Error(`${what} roothash must be a 64-char lowercase hex sha256; got ${value.roothash}`)
  }
}

function validateMeasurement(measurement: LaunchMeasurement, index: number): void {
  if (measurement.platform !== TeePlatform.sev_snp) {
    throw new Error(`measurements[${index}]: unknown TEE platform ${measurement.platform}`)
  }
  if (!measurement.registers) {
    throw new Error(`measurements[${index}]: registers is required`)
  }
  const keys = Object.keys(measurement.registers)
  if (keys.length !== 1 || keys[0] !== 'launch') {
    throw new Error(`measurements[${index}]: sev_snp registers must declare exactly { launch }`)
  }
  if (!REGISTER_VALUE_PATTERN.test(measurement.registers.launch)) {
    throw new Error(`measurements[${index}]: launch register must be a 96-char lowercase hex sha384`)
  }
}

export class VerifiableProgramMessageClient extends DefaultMessageClient<
  VerifiableProgramPublishConfiguration,
  VerifiableProgramContent
> {
  constructor(apiServer: string = DEFAULT_API_V2) {
    super(apiServer, MessageType.vProgram)
  }

  async send(conf: VerifiableProgramPublishConfiguration): Promise<VerifiableProgramMessage> {
    const { account, channel, sync = true } = conf
    const content = await this.prepareMessageContent(conf)

    const builtMessage = buildMessage(
      {
        account,
        channel,
        content,
        timestamp: content.time,
        storageEngine: ItemType.inline,
      },
      this.messageType,
    )

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      apiServer: this.apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: this.apiServer,
      sync,
    })

    return message
  }

  protected async prepareMessageContent({
    account,
    metadata,
    resources,
    requirements,
    environment,
    runtime,
    workload,
    verification,
    volumes = [],
    payment = {
      chain: Blockchain.ETH,
      type: PaymentType.credit,
    },
  }: VerifiableProgramPublishConfiguration): Promise<VerifiableProgramContent> {
    const timestamp = Date.now() / 1000
    const { address } = account

    if (payment.type !== PaymentType.credit) {
      throw new Error('V-Programs are credit-only: holder-tier and PAYG stream payments are not supported')
    }

    validateVerityRef(workload, 'workload')

    if (volumes.length > MAX_VERIFIED_VOLUMES) {
      throw new Error(`V-Programs support at most ${MAX_VERIFIED_VOLUMES} verified volumes; got ${volumes.length}`)
    }
    const verifiedVolumes: VerifiedVolume[] = volumes.map((volume, i) => {
      validateVerityRef(volume, `volumes[${i}]`)
      return {
        ref: volume.ref,
        hash_tree: volume.hash_tree,
        roothash: volume.roothash,
        comment: volume.comment ?? '',
      }
    })

    const { measurements } = verification
    if (!measurements || measurements.length < 1 || measurements.length > MAX_MEASUREMENTS) {
      throw new Error(`verification.measurements must contain between 1 and ${MAX_MEASUREMENTS} entries`)
    }
    measurements.forEach(validateMeasurement)
    const policy = verification.policy ?? DEFAULT_SNP_POLICY
    validateSnpPolicy(policy)

    const teeVerification: TeeVerification = {
      backend: verification.backend ?? 'sev_snp',
      policy,
      measurements,
    }

    const content: VerifiableProgramContent = {
      address,
      time: timestamp,
      allow_amend: false,
      payment,
      environment: {
        ...defaultVerifiableProgramEnvironment,
        ...environment,
      },
      resources: {
        ...defaultResources,
        ...resources,
      },
      runtime: {
        ref: runtime.ref,
        comment: runtime.comment ?? '',
      },
      workload: {
        ref: workload.ref,
        hash_tree: workload.hash_tree,
        roothash: workload.roothash,
      },
      verification: teeVerification,
      volumes: verifiedVolumes,
    }

    if (metadata !== undefined && metadata !== null) content.metadata = metadata
    if (requirements !== undefined && requirements !== null) content.requirements = requirements

    return content
  }
}

export default VerifiableProgramMessageClient
