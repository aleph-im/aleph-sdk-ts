import { ItemHash } from './base'

export type AbstractVolume = {
  comment?: string[]
  mount?: string[]
  is_read_only: () => boolean
}

/**
 * Immutable volumes contain extra files that can be used by a program and are stored on the Aleph network.
 * They can be shared by multiple programs and updated independently of the code of the program.
 *
 * You can use them to store Python libraries that your program depends on,
 * use them in multiple programs and update them independently of other programs.
 */
export type ImmutableVolume = AbstractVolume & {
  ref: string
  use_latest: boolean
  is_read_only: () => true
}

/**
 * Ephemeral volumes provide temporary disk storage to a VM during its execution without requiring more memory.
 */
export type EphemeralVolume = AbstractVolume & {
  ephemeral: true
  size_mib: number //Limit to 1 GiB
  is_read_only: () => false
}

export enum VolumePersistence {
  host = 'host',
  store = 'store',
}

/**
 * A reference volume to copy as a persistent volume.
 */
export type ParentVolume = {
  ref: ItemHash
  use_latest: boolean
}

/**
 * Host persistent volumes are empty volumes that your program can use to store information that,
 * would be useful to persist between executions but can be recovered from other sources.
 *
 * There is no guarantee that these volumes will not be deleted anytime,
 * when the program is not running and important data must be persisted on the Aleph network.
 */
export type PersistentVolume = AbstractVolume & {
  parent?: ParentVolume
  persistence: VolumePersistence
  name: string
  size_mib: number //Limit to 1 GiB
  is_read_only: () => false
}

export type MachineVolume = ImmutableVolume | EphemeralVolume | PersistentVolume
