import { gigabyteToMebibyte } from '@aleph-sdk/core'

import { RootfsVolume } from '../instance'
import { FunctionEnvironment, HypervisorType, InstanceEnvironment, MachineResources, VolumePersistence } from '../types'
import { VerifiableProgramEnvironment } from '../vprogram'

export const defaultExecutionEnvironment: FunctionEnvironment = {
  reproducible: false,
  internet: true,
  aleph_api: true,
  shared_cache: false,
}

export const defaultInstanceExecutionEnvironment: InstanceEnvironment = {
  reproducible: false,
  internet: true,
  aleph_api: true,
  shared_cache: false,
  hypervisor: HypervisorType.qemu,
}

export const defaultResources: MachineResources = {
  memory: 128,
  vcpus: 1,
  seconds: 30,
}

// https://github.com/aleph-im/aleph-message/blob/main/aleph_message/models/execution/volume.py#L63
export const MAXIMUM_DISK_SIZE = gigabyteToMebibyte(2048)

export const defaultRootfsVolume: RootfsVolume = {
  parent: {
    ref: 'f7e68c568906b4ebcd3cd3c4bfdff96c489cd2a9ef73ba2d7503f244dfd578de',
    use_latest: true,
  },
  persistence: VolumePersistence.host,
  size_mib: 0,
}

export const mockVolumeRef = 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe'

// --- V-PROGRAM (aleph_message/models/execution/vprogram.py, environment.py) ---

export const defaultVerifiableProgramEnvironment: VerifiableProgramEnvironment = {
  internet: true,
}

// SEV-SNP guest policy (64-bit). Bit 17 is reserved and must be 1; 0x30000
// is the minimal valid policy (bit 16 SMT allowed, bit 17 reserved).
export const SNP_POLICY_RESERVED_BIT_17 = 1n << 17n
export const DEFAULT_SNP_POLICY = 0x30000

export const MAX_MEASUREMENTS = 16
// Bounded by the kernel cmdline budget (one roothash per verified_volumes= slot)
export const MAX_VERIFIED_VOLUMES = 8
