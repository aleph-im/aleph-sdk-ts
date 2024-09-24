import { gigabyteToMebibyte } from '@aleph-sdk/core'

import { FunctionEnvironment, HypervisorType, InstanceEnvironment, MachineResources } from '../types'

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

export const MAXIMUM_DISK_SIZE = gigabyteToMebibyte(100)
