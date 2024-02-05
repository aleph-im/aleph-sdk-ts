import { Account } from '@aleph-sdk/account'
import {
  BaseContent,
  MachineVolume,
  ItemType,
  FunctionEnvironment,
  MachineResources,
  BaseMessage,
  MessageType,
} from '../types'

/**
 * Type of Encoding
 */
export enum Encoding {
  plain = 'plain',
  zip = 'zip',
  squashfs = 'squashfs',
}

/**
 * Type of execution
 */
export enum MachineType {
  vm_function = 'vm-function',
}

/**
 * Code to execute
 */
export type CodeContent = {
  encoding: Encoding
  entrypoint: string
  ref: string
  use_latest: boolean
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

export type ProgramContent = BaseContent & {
  type: MachineType
  allow_amend: boolean
  code: CodeContent
  variables?: { [key: string]: string }
  data?: DataContent
  export?: Export
  on: FunctionTriggers
  metadata?: Record<string, any>
  environment: FunctionEnvironment
  resources: MachineResources
  runtime: FunctionRuntime
  volumes: MachineVolume[]
  replaces?: string
}

export type ProgramMessage = BaseMessage & {
  content: ProgramContent
  type: MessageType.program
}

// ------------- SEND -------------------

/**
 * account:         The account used to sign the aggregate message.
 *
 * channel:         The channel in which the message will be published.
 *
 * storageEngine:   The storage engine to used when storing the message in case of Max_size (IPFS or Aleph storage).
 *
 * inlineRequested: If set to False, the Program message will be store on the same storageEngine you picked.
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * file:            The source code of the program in under Zip format.
 *
 * programRef:      The hahs of a Store message containing the code you want to use
 *
 * encoding:        Encoding system used by the codebase: plain/squashfs/zip
 *
 * entrypoint:      The entrypoint of your program.
 *
 * Subscription:    How to start you program? default by Http.
 *
 * memory:          Memory amount.
 *
 * runtime:         The docker image to use for the program.
 *
 * volumes:         mount point to use for storage.
 */
export type ProgramPublishConfiguration = {
  account: Account
  channel: string
  isPersistent?: boolean
  storageEngine?: ItemType.ipfs | ItemType.storage
  inlineRequested?: boolean
  APIServer?: string
  file?: Buffer | Blob
  programRef?: string
  encoding?: Encoding
  entrypoint: string
  subscription?: Record<string, unknown>[]
  memory?: number
  vcpus?: number
  runtime?: string
  volumes?: MachineVolume[]
  metadata?: Record<string, unknown>
  variables?: Record<string, string>
}

// ----------- SPAWN ------------

/**
 * account:         The account used to sign the aggregate message.
 *
 * channel:         The channel in which the message will be published.
 *
 * storageEngine:   The storage engine to used when storing the message in case of Max_size (IPFS or Aleph storage).
 *
 * inlineRequested: If set to False, the Program message will be store on the same storageEngine you picked.
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * file:            The source code of the program in under Zip format.
 *
 * entrypoint:      The entrypoint of your program.
 *
 * Subscription:    How to start you program? default by Http.
 *
 * memory:          Memory amount.
 *
 * runtime:         The docker image to use for the program.
 *
 * volumes:         mount point to use for storage.
 */
export type ProgramSpawnConfiguration = {
  account: Account
  channel: string
  isPersistent?: boolean
  storageEngine?: ItemType.ipfs | ItemType.storage
  inlineRequested?: boolean
  APIServer?: string
  programRef: string
  entrypoint: string
  encoding?: Encoding
  subscription?: Record<string, unknown>[]
  memory?: number
  vcpus?: number
  runtime?: string
  volumes?: MachineVolume[]
  metadata?: Record<string, unknown>
  variables?: Record<string, string>
}
