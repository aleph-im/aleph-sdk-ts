import { DEFAULT_API_V2 } from '../../global'
import { BaseMessage, MessageType } from '../types'
import { GetMessages } from './getMessages'

type GetMessageParams = {
  hashes: string[]
  channels?: string[]
  messageType?: MessageType
  APIServer?: string
}

type GetMessageConfiguration = {
  hash: string
  channel?: string
  messageType?: MessageType
  APIServer?: string
}

//TODO: Provide websocket binding (Refacto Get into GetQuerryBuilder)

/**
 * Retrieves a specific Message with query params.
 *
 * @param configuration The message params to make the query.
 */
export async function GetMessage<T = BaseMessage>({
  hash,
  channel,
  messageType,
  APIServer = DEFAULT_API_V2,
}: GetMessageConfiguration): Promise<T> {
  const params: GetMessageParams = {
    hashes: [hash],
    channels: channel ? [channel] : undefined,
    messageType,
    APIServer,
  }

  const response = await GetMessages(params)
  if (response.messages.length === 0) {
    throw new Error(`No messages found for: ${hash}`)
  }
  return response.messages[0] as unknown as T
}
