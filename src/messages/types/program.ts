import { BaseExecutableContent, MachineType } from './execution'

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
