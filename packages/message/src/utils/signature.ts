import axios, { AxiosError } from 'axios'

import { getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { Account } from '@aleph-sdk/account'
import { HashedMessage, MessageContent, MessageStatus, SignedMessage } from '../types'
import { BroadcastError, InvalidMessageError } from '../types/errors'

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
        message: signedMessage.getBroadcastable(),
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
        throw new BroadcastError([`Unexpected status code: ${response.status}, ${response.statusText}`])
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
            data: signedMessage.getBroadcastable(),
          },
          {
            socketPath: getSocketPath(),
          },
        )
        return { response, status: MessageStatus.pending }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 422) {
            try {
              throw new InvalidMessageError(error)
            } catch (error) {
              throw new BroadcastError(error as AxiosError)
            }
          }
        }
        throw error
      }
    case 422:
      throw new InvalidMessageError(error)
    default:
      throw error
  }
}
