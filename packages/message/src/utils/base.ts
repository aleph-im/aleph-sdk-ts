import { Account } from "@aleph-sdk/account"
import { BuiltMessage, MessageContent, MessageCost } from "../types"
import { prepareAlephMessage } from "./publish"
import { getMessageCost } from "./cost"
import { stripTrailingSlash } from "@aleph-sdk/core"

export type DefaultMessageConfiguration = {
  account: Account
  channel?: string
}

export abstract class DefaultMessageClient<T extends DefaultMessageConfiguration, C extends MessageContent> {
  constructor(
    protected apiServer: string
  ) {
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