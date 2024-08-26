import { Blockchain } from '@aleph-sdk/core'
import { MachineVolume } from './volumes'
import { BaseContent, PaymentType } from './base'

/**
 * Properties of the execution function environment
 *
 * reproducible: The function is deterministic (not available yet)
 * internet: Allow internet access
 * aleph_api: Allow access to the Aleph API
 * shared_cache: Allow access to the shared redis cache
 */
export type FunctionEnvironment = {
  reproducible: false
  internet: boolean
  aleph_api: boolean
  shared_cache: boolean
}

/**
 * Properties of the trusted execution environment
 *
 * firmware: Firmware to use for the trusted execution
 * policy: Policy to use for trusted execution
 */
export type TrustedExecutionEnvironment = {
  firmware: string
  policy: number
}

/**
 * Properties of the execution instance environment
 *
 * reproducible: The function is deterministic (not available yet)
 * internet: Allow internet access
 * aleph_api: Allow access to the Aleph API
 * shared_cache: Allow access to the shared redis cache
 * hypervisor: Hypervisor to use for the execution, can be Firecracker or Qemu
 * trusted_execution: Sets the execution as confidential
 */
export type InstanceEnvironment = {
  internet: boolean
  aleph_api: boolean
  hypervisor?: HypervisorType
  trusted_execution?: Partial<TrustedExecutionEnvironment>
  // The following fields are kept for retro-compatibility.
  shared_cache: boolean
  reproducible: false
}

/**
 * System resources required
 *
 * vcpus: Number of virtual CPUs
 * memory: Memory in MiB
 * seconds: Timeout in seconds
 */
export type MachineResources = {
  vcpus: number
  memory: number
  seconds: number
}

/**
 * architecture: CPU architecture
 * vendor: CPU vendor. Allows other vendors.
 */
export type CpuProperties = {
  architecture?: 'x86_64' | 'arm64'
  vendor?: 'AuthenticAMD' | 'GenuineIntel' | string
}

/**
 * Additional properties required for the node
 *
 * owner: Owner address of the node (not available yet)
 * address_regex: Regular expression to match the node address (not available yet)
 */
export type NodeRequirements = {
  owner?: string
  address_regex?: string
}

/**
 * cpu: Required CPU properties
 * node: Required Compute Resource Node properties
 */
export type HostRequirements = {
  cpu?: CpuProperties
  node?: NodeRequirements
}

/**
 * Payment solution
 *
 * chain: Blockchain to use
 * receiver: Receiver address, should be usually the (streaming) reward address of the targeted node
 * type: Payment type (hold, stream)
 */
export type Payment = {
  chain: Blockchain
  receiver?: string
  type: PaymentType
}

/**
 * Abstract content for execution messages (Instances, Programs).
 *
 * allow_amend: Allow amends to update this function
 * metadata: Metadata of the VM
 * authorized_keys: SSH public keys authorized to connect to the VM
 * variables: Environment variables available in the VM
 * environment: Properties of the execution environment
 * resources: System resources required
 * requirements: System properties required
 * volumes: Volumes to mount on the filesystem
 * replaces: Previous version to replace. Must be signed by the same address"
 */
export type BaseExecutableContent = BaseContent & {
  allow_amend: boolean
  metadata?: Record<string, unknown>
  authorized_keys?: string[]
  variables?: Record<string, string>
  environment: FunctionEnvironment
  resources: MachineResources
  payment?: Payment
  requirements?: HostRequirements
  volumes: MachineVolume[]
  replaces?: string
}

export enum MachineType {
  vm_function = 'vm-function',
  vm_instance = 'vm-instance',
}

export enum HypervisorType {
  qemu = 'qemu',
  firecracker = 'firecracker',
}
