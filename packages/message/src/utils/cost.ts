import { stripTrailingSlash, getSocketPath } from '@aleph-sdk/core'
import axios from 'axios'

import { CostComputableMessage, MessageContent, MessageCost } from '../types'

export type GetMessageCostConfiguration = {
  hash: string
  apiServer: string
}

export type GetMessageCostResponse = {
  response: MessageCost
}

export type GetMessageEstimatedCostConfiguration<C extends MessageContent> = {
  message: CostComputableMessage<C>
  apiServer: string
}

export type GetMessageEstimatedCostResponse<C extends MessageContent> = {
  message: CostComputableMessage<C>
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
    { message },
    { socketPath: getSocketPath() },
  )

  return {
    message,
    response: response.data,
  }
}
