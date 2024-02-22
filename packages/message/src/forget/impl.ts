import { DEFAULT_API_V2, stripTrailingSlash } from '@aleph-sdk/core'
import { buildForgetMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'
import { ForgetContent, ForgetMessage, ForgetPublishConfiguration } from './types'
import { ItemType } from '../types'

export class ForgetMessageClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }
  /**
   * Submit a forget object to remove content from a Post message on the network.
   *
   * Account submitting the forget message. Should either be:
   * The sender of the original message to forget.
   * the sender of the VM that created the message.
   * The address the original message was attributed to.
   *
   * @param configuration The configuration used to publish the forget message.
   */
  async send({
    account,
    hashes,
    reason,
    channel,
    storageEngine = ItemType.inline,
    sync = false,
  }: ForgetPublishConfiguration): Promise<ForgetMessage> {
    const timestamp = Date.now() / 1000
    const forgetContent: ForgetContent = {
      address: account.address,
      time: timestamp,
      hashes: hashes,
      reason: reason || undefined,
    }

    const builtMessage = buildForgetMessage({
      account,
      channel,
      timestamp,
      storageEngine,
      content: forgetContent,
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      apiServer: this.apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: this.apiServer,
      sync,
    })
    return message
  }
}

export default ForgetMessageClient
