import {MessageType} from "@aleph-sdk/message";
import {Blockchain} from "@aleph-sdk/core";

export type MessageFilter = {
  messageTypes?: MessageType[]
  contentTypes?: string[]
  contentKeys?: string[]
  refs?: string[]
  addresses?: string[]
  tags?: string[]
  hashes?: string[]
  channels?: string[]
  chains?: Blockchain[]
  startDate?: Date | number
  endDate?: Date | number
}

export type PostFilter = {
  types?: string[]
  refs?: string[]
  addresses?: string[]
  tags?: string[]
  hashes?: string[]
  channels?: string[]
  chains?: string[]
  startDate?: Date | number
  endDate?: Date | number
}