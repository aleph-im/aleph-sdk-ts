import { BaseExecutableContent, ParentVolume, VolumePersistence } from '../types'

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
