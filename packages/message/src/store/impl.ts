import axios from 'axios'

import { DEFAULT_API_V2, stripTrailingSlash, getSocketPath, RequireOnlyOne } from '@aleph-sdk/core'
import {
  StoreContent,
  StoreGetConfiguration,
  StoreMessage,
  StorePinConfiguration,
  StorePublishConfiguration,
} from './types'
import { MessageBuilder } from '../utils/messageBuilder'
import { PushFileToStorageEngine, PutContentToStorageEngine } from '../utils/publish'
import { SignAndBroadcast } from '../utils/signature'
import { ItemType, MessageType } from '../types'

export class StoreMessageClient {
  /**
   * Retrieves a store message, i.e. a message containing a File.
   *
   * @param configuration The message hash and the API Server endpoint to make the query.
   */
  async get({ fileHash = '', APIServer = DEFAULT_API_V2 }: StoreGetConfiguration): Promise<ArrayBuffer> {
    const response = await axios.get<ArrayBuffer>(
      `${stripTrailingSlash(APIServer)}/api/v0/storage/raw/${fileHash}?find`,
      {
        responseType: 'arraybuffer',
        socketPath: getSocketPath(),
      },
    )

    return response.data
  }

  /**
   * Publishes a store message, containing a File.
   * You also have to provide default message properties, such as the targeted channel or the account used to sign the message.
   *
   * @param spc The configuration used to publish a store message.
   */
  async send({
    account,
    APIServer = DEFAULT_API_V2,
    storageEngine = ItemType.storage,
    inlineRequested = true,
    channel,
    fileHash,
    fileObject,
  }: RequireOnlyOne<StorePublishConfiguration, 'fileObject' | 'fileHash'>): Promise<StoreMessage> {
    if (!fileObject && !fileHash) throw new Error('You need to specify a File to upload or a Hash to pin.')
    if (fileObject && fileHash) throw new Error("You can't pin a file and upload it at the same time.")
    if (fileHash && storageEngine !== ItemType.ipfs) throw new Error('You must choose ipfs to pin file.')

    const hash =
      fileHash ||
      (await PushFileToStorageEngine({
        APIServer,
        storageEngine,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        file: fileObject,
      }))

    const timestamp = Date.now() / 1000
    const storeContent: StoreContent = {
      address: account.address,
      item_type: storageEngine,
      item_hash: hash,
      time: timestamp,
    }

    const message = MessageBuilder<StoreContent, MessageType.store>({
      account,
      channel,
      timestamp,
      storageEngine,
      content: storeContent,
      type: MessageType.store,
    })

    await PutContentToStorageEngine({
      message: message,
      content: storeContent,
      inline: inlineRequested,
      APIServer,
    })

    await SignAndBroadcast({
      message: message,
      account,
      APIServer,
    })

    return message
  }

  /**
   * Publishes a store message, containing a hash to pin an IPFS file.
   * You also have to provide default message properties, such as the targeted channel or the account used to sign the message.
   *
   * @param spc The configuration used to pin the file.
   */
  async pin(spc: StorePinConfiguration): Promise<StoreMessage> {
    if (spc.storageEngine) console.warn('storageEngine param is deprecated and will be removed soon for pinning')

    return this.send({
      account: spc.account,
      channel: spc.channel,
      fileHash: spc.fileHash,
      APIServer: spc.APIServer || DEFAULT_API_V2,
      storageEngine: ItemType.ipfs,
    })
  }
}

export default StoreMessageClient
