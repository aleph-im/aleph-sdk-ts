import { Account } from '@aleph-sdk/account'

import { ItemHash } from '../types'
import { BaseContent } from '../types/base'
import { PaymentType } from '../types/base'
import { HostRequirements, MachineResources, Payment } from '../types/execution'

/**
 * TEE backend a V-Program launches with. Distinct from TeePlatform (which
 * describes what a launch measurement's registers are defined for), even
 * though the two share a value today.
 */
export type TeeBackend = 'sev_snp'

/**
 * V-Programs are credit-only: holder-tier and PAYG stream payments are
 * rejected by the network.
 */
export type VerifiableProgramPayment = Payment & { type: PaymentType.credit }

/**
 * TEE platforms with a defined launch-measurement semantics.
 * Unknown platforms are schema-invalid on the network.
 */
export enum TeePlatform {
  sev_snp = 'sev_snp',
}

/**
 * The measurement registers SEV-SNP pins: one launch digest
 * (48-byte SHA-384, 96 lowercase hex characters).
 */
export type SevSnpRegisters = {
  launch: string
}

/**
 * Expected measurement registers a verifier should expect for one vcpu_type.
 *
 * platform: TEE platform the registers are defined for
 * registers: Expected measurement registers; sev_snp declares { launch }
 * vcpu_type: QEMU CPU model these registers were computed for (e.g. 'EPYC-v4').
 *   Required by direct-boot measurement recipes, absent for igvm bundles.
 */
export type LaunchMeasurement = {
  platform: TeePlatform
  registers: SevSnpRegisters
  vcpu_type?: string
}

/**
 * TEE launch configuration plus supervisor-opaque measurement annotations.
 *
 * backend: TEE backend the VM launches with
 * policy: SEV-SNP 64-bit guest policy (reserved bit 17 must be set)
 * measurements: Expected measurement registers; never sent to the supervisor
 */
export type TeeVerification = {
  backend: TeeBackend
  policy: number
  measurements: LaunchMeasurement[]
}

/**
 * The measured platform: a store message holding the runtime manifest.
 * There is deliberately no use_latest: the reference must be immutable.
 */
export type VerifiableProgramRuntime = {
  ref: ItemHash
  comment: string
}

/**
 * The user's code: a read-only ext4 volume bound into the measured TCB
 * via its dm-verity root hash.
 *
 * ref: Store message of the workload data image
 * hash_tree: Store message of the dm-verity hash tree for the data image
 * roothash: dm-verity root hash (sha256, lowercase hex)
 */
export type VerifiedWorkload = {
  ref: ItemHash
  hash_tree: ItemHash
  roothash: string
}

/**
 * An extra read-only data volume bound into the attested TCB.
 * Volumes are positional; there is deliberately no mount field.
 */
export type VerifiedVolume = VerifiedWorkload & {
  comment: string
}

/**
 * Execution environment flags. The hypervisor is always QEMU.
 */
export type VerifiableProgramEnvironment = {
  internet: boolean
}

/**
 * Message content for scheduling a verifiable program (V-Program): an
 * auto-booting SEV-SNP VM whose full software stack is attestable.
 *
 * Compared to BaseExecutableContent: payment is required and credit-only,
 * volumes are verity-bound, and the unmeasured input channels
 * (variables, authorized_keys) and amendment channels (allow_amend, replaces)
 * are rejected by the network.
 */
export type VerifiableProgramContent = BaseContent & {
  allow_amend: false
  metadata?: Record<string, unknown>
  payment: VerifiableProgramPayment
  environment: VerifiableProgramEnvironment
  resources: MachineResources
  requirements?: HostRequirements
  runtime: VerifiableProgramRuntime
  workload: VerifiedWorkload
  verification: TeeVerification
  volumes: VerifiedVolume[]
}

// ---------------- SEND -------------------

export type VerifiableProgramRuntimeConfiguration = {
  ref: ItemHash
  comment?: string
}

export type VerifiedVolumeConfiguration = VerifiedWorkload & {
  comment?: string
}

export type TeeVerificationConfiguration = {
  backend?: TeeBackend
  policy?: number
  measurements: LaunchMeasurement[]
}

export type VerifiableProgramPublishConfiguration = {
  account: Account
  channel?: string
  metadata?: Record<string, unknown>
  resources?: Partial<MachineResources>
  requirements?: HostRequirements
  environment?: Partial<VerifiableProgramEnvironment>
  runtime: VerifiableProgramRuntimeConfiguration
  workload: VerifiedWorkload
  verification: TeeVerificationConfiguration
  volumes?: VerifiedVolumeConfiguration[]
  payment?: VerifiableProgramPayment
  sync?: boolean
}
