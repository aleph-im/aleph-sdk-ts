import { stripTrailingSlash, getSocketPath } from '@aleph-sdk/core'
import axios from 'axios'

import { HashedMessage, MessageContent, MessageCost } from '../types'

export type GetMessageCostConfiguration = {
  hash: string
  apiServer: string
}

export type GetMessageCostResponse = {
  response: MessageCost
}

export type GetMessageEstimatedCostConfiguration<C extends MessageContent> = {
  message: HashedMessage<C>
  apiServer: string
}

export type GetMessageEstimatedCostResponse<C extends MessageContent> = {
  message: HashedMessage<C>
  response: MessageCost
}

export async function getMessageCost({
  hash,
  apiServer,
}: GetMessageCostConfiguration): Promise<GetMessageCostResponse> {
  const response = await axios.get(`${stripTrailingSlash(apiServer)}/api/v0/price/${hash}`, {
    socketPath: getSocketPath(),
  })

  return {
    response: response.data,
  }
}

export async function getMessageEstimatedCost<C extends MessageContent>({
  message,
  apiServer,
}: GetMessageEstimatedCostConfiguration<C>): Promise<GetMessageEstimatedCostResponse<C>> {
  const response = await axios.post(
    `${stripTrailingSlash(apiServer)}/api/v0/price/estimate`,
    { message: message.getMessageEstimatedCostRequestSchema() },
    { socketPath: getSocketPath() },
  )

  return {
    message,
    response: response.data,
  }
}
