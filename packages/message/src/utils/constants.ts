import { FunctionEnvironment, MachineResources } from '../types'
import { gigabyteToMebibyte } from '@aleph-sdk/core'

export const defaultExecutionEnvironment: FunctionEnvironment = {
  reproducible: false,
  internet: true,
  aleph_api: true,
  shared_cache: false,
}

export const defaultResources: MachineResources = {
  memory: 128,
  vcpus: 1,
  seconds: 30,
}

export const MAXIMUM_DISK_SIZE = gigabyteToMebibyte(100)
