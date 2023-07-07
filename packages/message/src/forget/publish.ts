import { DEFAULT_API_V2 } from '@aleph-sdk/core'
import { Account } from '@aleph-sdk/account'
import { PutContentToStorageEngine } from '../create/publish'
import { ForgetContent, ForgetMessage, ItemType, MessageType } from '../types'
import { SignAndBroadcast } from '../create/signature'
import { MessageBuilder } from '../messageBuilder'

/**
 * account:         The account used to sign the forget object.
 *
 * channel:         The channel in which the object will be published.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * inlineRequested: [Deprecated, use storageEngine instead] - Will the message be inlined ?
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * hashes:          The Hashes of the Aleph's message to forget.
 *
 * reason:          An optional reason to justify this action (default value: "None").
 */
type ForgetPublishConfiguration = {
  account: Account
  channel: string
  storageEngine?: ItemType
  inlineRequested?: boolean
  APIServer?: string
  hashes: string[]
  reason?: string
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
export async function Publish({
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
