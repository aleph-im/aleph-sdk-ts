import { Account } from '@aleph-sdk/account'

import { ItemType } from '../types/base'
import {
  BaseExecutableContent,
  HostRequirements,
  InstanceEnvironment,
  MachineResources,
  Payment,
} from '../types/execution'
import { CostEstimationMachineVolume, MachineVolume, ParentVolume, VolumePersistence } from '../types/volumes'

/**
 * Root file system of a VM instance.
 * The root file system of an instance is built as a copy of a reference image, named parent image. The user determines a custom size and persistence model.
 */
export type RootfsVolume = {
  parent: ParentVolume
  persistence: VolumePersistence
  size_mib: number //Limit to 1 GiB
}

/**
 * Message content for scheduling a VM instance on the network.
 *
 * rootfs: Root filesystem of the system, will be booted by the kernel"
 */
export type InstanceContent = BaseExecutableContent & {
  rootfs: RootfsVolume
}

export type CostEstimationInstanceContent = InstanceContent & {
  volumes?: CostEstimationMachineVolume[]
}

// ---------------- SEND -------------------

export type InstancePublishConfiguration = {
  account: Account
  channel?: string
  metadata?: Record<string, unknown>
  variables?: Record<string, string>
  authorized_keys?: string[]
  resources?: Partial<MachineResources>
  requirements?: HostRequirements
  environment?: Partial<InstanceEnvironment>
  image?: string
  volumes?: MachineVolume[]
  storageEngine?: ItemType.ipfs | ItemType.storage
  payment?: Payment
  sync?: boolean
}

export type CostEstimationInstancePublishConfiguration = InstancePublishConfiguration & {
  volumes?: CostEstimationMachineVolume[]
}
