import { PaymentType } from './base'

export enum MessageCostType {
  EXECUTION = 'EXECUTION',
  EXECUTION_VOLUME_PERSISTENT = 'EXECUTION_VOLUME_PERSISTENT',
  EXECUTION_VOLUME_INMUTABLE = 'EXECUTION_VOLUME_INMUTABLE',
  EXECUTION_VOLUME_DISCOUNT = 'EXECUTION_VOLUME_DISCOUNT',
  EXECUTION_INSTANCE_VOLUME_ROOTFS = 'EXECUTION_INSTANCE_VOLUME_ROOTFS',
  EXECUTION_PROGRAM_VOLUME_CODE = 'EXECUTION_PROGRAM_VOLUME_CODE',
  EXECUTION_PROGRAM_VOLUME_RUNTIME = 'EXECUTION_PROGRAM_VOLUME_RUNTIME',
  EXECUTION_PROGRAM_VOLUME_DATA = 'EXECUTION_PROGRAM_VOLUME_DATA',
  STORAGE = 'STORAGE',
}

export type MessageCostLine = {
  type: MessageCostType
  name: string
  cost_hold: string
  cost_stream: string
}

export type MessageCost = {
  // @note: legacy but not used
  // "required_tokens": number,
  payment_type: PaymentType
  cost: string
  detail: MessageCostLine[]
}
