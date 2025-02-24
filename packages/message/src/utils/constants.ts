import { gigabyteToMebibyte } from '@aleph-sdk/core'

import { RootfsVolume } from '../instance'
import { FunctionEnvironment, HypervisorType, InstanceEnvironment, MachineResources, VolumePersistence } from '../types'

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
