import { DEFAULT_API_V2 } from '@aleph-sdk/core'
import { MessageBuilder } from '../utils/messageBuilder'
import { PutContentToStorageEngine } from '../utils/publish'
import { SignAndBroadcast } from '../utils/signature'
import { ForgetContent, ForgetMessage, ForgetPublishConfiguration } from './types'
import { ItemType, MessageType } from '../types'

export class ForgetMessageClient {
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
    APIServer = DEFAULT_API_V2,
    hashes,
    reason,
    channel,
    storageEngine = ItemType.inline,
    inlineRequested,
  }: ForgetPublishConfiguration): Promise<ForgetMessage> {
    if (inlineRequested) console.warn('inlineRequested is deprecated and will be removed: use storageEngine.inline')

    const timestamp = Date.now() / 1000
    const forgetContent: ForgetContent = {
      address: account.address,
      time: timestamp,
      hashes: hashes,
      reason: reason || undefined,
    }

    const message = MessageBuilder<ForgetContent, MessageType.forget>({
      account,
      channel,
      timestamp,
      storageEngine,
      content: forgetContent,
      type: MessageType.forget,
    })

    await PutContentToStorageEngine({
      message: message,
      content: forgetContent,
      APIServer,
    })

    await SignAndBroadcast({
      message: message,
      account,
      APIServer,
    })
    return message
  }
}

export default ForgetMessageClient
