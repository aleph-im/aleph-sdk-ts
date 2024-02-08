import axios from 'axios'

import { getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { Account } from '@aleph-sdk/account'
import { BuiltMessage } from './messageBuilder'
import { BaseMessage } from '../types'

type SignAndBroadcastConfiguration = {
  message: BuiltMessage<any, any>
  account: Account
  APIServer: string
}

type BroadcastConfiguration = Omit<SignAndBroadcastConfiguration, 'message'> & {
  message: BaseMessage
}

export async function SignAndBroadcast(configuration: SignAndBroadcastConfiguration): Promise<void> {
  const signedMessage: BroadcastConfiguration = {
    account: configuration.account,
    APIServer: configuration.APIServer,
    message: {
      ...configuration.message,
      signature: await configuration.account.Sign(configuration.message),
    },
  }
  await Broadcast(signedMessage)
}

async function Broadcast(configuration: BroadcastConfiguration) {
  try {
    await axios.post(
      `${stripTrailingSlash(configuration.APIServer)}/api/v0/ipfs/pubsub/pub`,
      {
        topic: 'ALEPH-TEST',
        data: JSON.stringify(configuration.message),
      },
      {
        socketPath: getSocketPath(),
      },
    )
  } catch (err) {
    console.warn(err)
  }
}
