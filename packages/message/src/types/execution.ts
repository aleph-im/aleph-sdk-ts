import { BaseContent } from './base'
import { MachineVolume } from './volumes'

/**
 * Properties of the execution environment
 */
export type FunctionEnvironment = {
  reproducible: boolean
  internet: boolean
  aleph_api: boolean
  shared_cache: boolean
}

/**
 * System resources required
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
 * Address of the node owner
 * Node address must match this regular expression
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
  requirements?: HostRequirements
  volumes: MachineVolume[]
  replaces?: string
}
