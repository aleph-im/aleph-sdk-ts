import { Account } from '@aleph-sdk/account'
import { stripTrailingSlash } from '@aleph-sdk/core'

import { BuiltMessage, MessageContent, MessageCost } from '../types'
import { getMessageCost } from './cost'
import { prepareAlephMessage } from './publish'

export type DefaultMessageConfiguration = {
  account: Account
  channel?: string
}

export abstract class DefaultMessageClient<T extends DefaultMessageConfiguration, C extends MessageContent> {
  constructor(protected apiServer: string) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  protected abstract prepareMessage(config: T): Promise<BuiltMessage<C>>

  async getCost(conf: T): Promise<MessageCost> {
    const { apiServer } = this

    const builtMessage = await this.prepareMessage(conf)
    const hashedMessage = await prepareAlephMessage({ message: builtMessage, apiServer })
    const { response } = await getMessageCost({ message: hashedMessage, apiServer })

    return response
  }
}
