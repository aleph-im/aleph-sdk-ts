import { Account } from '@aleph-sdk/account'
import { stripTrailingSlash } from '@aleph-sdk/core'

import { ItemType, MessageContent, MessageCost, MessageType } from '../types'
import { getMessageCost } from './cost'
import { buildMessage } from './messageBuilder'
import { prepareAlephMessage } from './publish'

export type DefaultMessageConfiguration = {
  account: Account
  channel?: string
}

export abstract class DefaultMessageClient<
  Cfg extends DefaultMessageConfiguration,
  Cnt extends MessageContent,
  CostCfg extends Cfg = Cfg,
  CostCnt extends Cnt = Cnt,
> {
  constructor(
    protected apiServer: string,
    protected messageType: MessageType,
  ) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  async getCost(config: CostCfg): Promise<MessageCost> {
    const { apiServer } = this
    const { channel, account } = config

    const content = await this.prepareCostEstimationMessageContent(config)

    console.log(content)
    const builtMessage = buildMessage(
      {
        channel,
        content,
        account,
        storageEngine: ItemType.inline,
        timestamp: content.time,
      },
      this.messageType,
    )
    const hashedMessage = await prepareAlephMessage({ message: builtMessage, apiServer })
    const { response } = await getMessageCost({ message: hashedMessage, apiServer })

    return response
  }

  protected async prepareCostEstimationMessageContent(config: CostCfg): Promise<CostCnt> {
    const content: Cnt = await this.prepareMessageContent(config)
    return content as CostCnt
  }

  protected abstract prepareMessageContent(config: Cfg): Promise<Cnt>
}
