import axios, { AxiosError } from 'axios'

import { getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { Account } from '@aleph-sdk/account'
import { HashedMessage, MessageContent, MessageStatus, SignedMessage } from '../types'

type SignAndBroadcastConfiguration<C extends MessageContent> = {
  message: HashedMessage<C>
  account: Account
  apiServer: string
  sync?: boolean
}

type SignAndBroadcastResponse<C extends MessageContent> = {
  message: SignedMessage<C>
  status: MessageStatus
  response: unknown
}

export async function broadcast<C extends MessageContent>(
  configuration: SignAndBroadcastConfiguration<C>,
): Promise<SignAndBroadcastResponse<C>> {
  const signedMessage = new SignedMessage<C>({
    ...configuration.message,
    signature: await configuration.account.sign(configuration.message),
  })
  let response, status
  try {
    response = await axios.post(
      `${stripTrailingSlash(configuration.apiServer)}/api/v0/messages`,
      {
        sync: configuration.sync || false,
        message: JSON.stringify(signedMessage),
      },
      {
        socketPath: getSocketPath(),
      },
    )
    switch (response.status) {
      case 200:
        status = MessageStatus.processed
        break
      case 202:
        status = MessageStatus.pending
        break
      default:
        throw new Error(`Unexpected status code: ${response.status}, ${response.statusText}`)
    }
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error

    const result = await handleBroadcastError(error, configuration, signedMessage)
    response = result.response
    status = result.status
  }
  return {
    message: signedMessage,
    status: status,
    response: response.data,
  }
}

async function handleBroadcastError<C extends MessageContent>(
  error: AxiosError,
  configuration: SignAndBroadcastConfiguration<C>,
  signedMessage: SignedMessage<C>,
) {
  if (!error.response) throw error
  switch (error.response.status) {
    case 404:
    case 405:
      // Fallback to deprecated pubsub
      try {
        const response = await axios.post(
          `${stripTrailingSlash(configuration.apiServer)}/api/v0/ipfs/pubsub/pub`,
          {
            topic: 'ALEPH-TEST',
            data: JSON.stringify(signedMessage),
          },
          {
            socketPath: getSocketPath(),
          },
        )
        return { response, status: MessageStatus.pending }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status !== 500) return { response: error.response, status: MessageStatus.rejected }
        }
        throw error
      }
    case 422:
      return { response: error.response, status: MessageStatus.rejected }
    default:
      throw error
  }
}
