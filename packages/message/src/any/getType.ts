import { AggregateMessage, BaseMessage, ForgetMessage, PostMessage, ProgramMessage, StoreMessage } from '../types'

export function Program(message: BaseMessage): message is ProgramMessage {
  if (message !== null && typeof message === 'object') {
    return message.type === 'PROGRAM'
  }
  return false
}

export function Store(message: BaseMessage): message is StoreMessage {
  if (message !== null && typeof message === 'object') {
    return message.type === 'STORE'
  }
  return false
}

export function Forget(message: BaseMessage): message is ForgetMessage {
  if (message !== null && typeof message === 'object') {
    return message.type === 'FORGET'
  }
  return false
}

export function Post<T>(message: BaseMessage): message is PostMessage<T> {
  if (message !== null && typeof message === 'object') {
    return message.type === 'POST'
  }
  return false
}

export function Aggregate<T>(message: BaseMessage): message is AggregateMessage<T> {
  if (message !== null && typeof message === 'object') {
    return message.type === 'AGGREGATE'
  }
  return false
}
