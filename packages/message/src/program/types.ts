import { Account } from '@aleph-sdk/account'
import { RequireOnlyOne } from '@aleph-sdk/core'

import { ItemType } from '../types/base'
import { BaseExecutableContent, MachineType, Payment } from '../types/execution'
import { CostEstimationMachineVolume, MachineVolume } from '../types/volumes'

export enum Encoding {
  plain = 'plain',
  zip = 'zip',
  squashfs = 'squashfs',
}

export enum InterfaceType {
  asgi = 'asgi',
  binary = 'binary',
}

export type CodeContent = {
  encoding: Encoding
  entrypoint: string
  ref: string
  use_latest: boolean
  interface?: InterfaceType
  args?: string[]
}

/**
 * Data to use during computation
 */
export type DataContent = {
  encoding: Encoding
  mount: string
  ref: string
  use_latest: boolean
}

/**
 * Data to export after computation
 */
export type Export = {
  encoding: Encoding
  mount: string
}

/**
 * Signals that trigger an execution
 */
export type FunctionTriggers = {
  http: boolean
  message?: Record<string, unknown>[]
  persistent?: boolean
}

/**
 * Execution runtime (rootfs with Python interpreter)
 */
export type FunctionRuntime = {
  ref: string
  use_latest: boolean
  comment: string
}

export type ProgramContent = BaseExecutableContent & {
  type: MachineType.vm_function
  code: CodeContent
  runtime: FunctionRuntime
  data?: DataContent
  export?: Export
  on: FunctionTriggers
}

export type CostEstimationProgramContent = ProgramContent & {
  volumes: CostEstimationMachineVolume[]
}

export type ProgramPublishConfiguration = RequireOnlyOne<
  {
    account: Account
    channel: string
    isPersistent?: boolean
    storageEngine?: ItemType.ipfs | ItemType.storage
    file?: Buffer | Blob
    programRef?: string
    encoding?: Encoding
    entrypoint: string
    subscriptions?: Record<string, unknown>[]
    memory?: number
    vcpus?: number
    runtime?: string
    volumes?: MachineVolume[]
    metadata?: Record<string, unknown>
    variables?: Record<string, string>
    payment?: Payment
    sync?: boolean
  },
  'programRef' | 'file'
>

export type CostEstimationProgramPublishConfiguration = ProgramPublishConfiguration & {
  volumes?: CostEstimationMachineVolume[]
}

export type ProgramSpawnConfiguration = {
  account: Account
  channel: string
  isPersistent?: boolean
  storageEngine?: ItemType.ipfs | ItemType.storage
  programRef: string
  entrypoint: string
  encoding?: Encoding
  subscriptions?: Record<string, unknown>[]
  memory?: number
  vcpus?: number
  runtime?: string
  volumes?: MachineVolume[]
  metadata?: Record<string, unknown>
  variables?: Record<string, string>
  payment?: Payment
  sync?: boolean
}
