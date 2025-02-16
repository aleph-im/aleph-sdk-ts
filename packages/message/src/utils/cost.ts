import { stripTrailingSlash, getSocketPath } from '@aleph-sdk/core'
import axios from 'axios'

import { HashedMessage, MessageContent, MessageCost } from '../types'

export type GetMessageCostConfiguration<C extends MessageContent> = {
  message: HashedMessage<C>
  apiServer: string
}

export type GetMessageCostResponse<C extends MessageContent> = {
  message: HashedMessage<C>
  response: MessageCost
}

export async function getMessageCost<C extends MessageContent>({
  message,
  apiServer,
}: GetMessageCostConfiguration<C>): Promise<GetMessageCostResponse<C>> {
  const response = await axios.post(
    `${stripTrailingSlash(apiServer)}/api/v0/price/estimate`,
    { message: message.getMessageCostRequestSchema() },
    { socketPath: getSocketPath() },
  )

  return {
    message,
    response: response.data,
  }
}
