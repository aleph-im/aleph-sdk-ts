import axios from 'axios'

import { DEFAULT_API_V2, stripTrailingSlash, getSocketPath, RequireOnlyOne } from '@aleph-sdk/core'
import {
  StoreContent,
  StoreGetConfiguration,
  StoreMessage,
  StorePinConfiguration,
  StorePublishConfiguration,
} from './types'
import { buildStoreMessage } from '../utils/messageBuilder'
import { pushFileToStorageEngine, prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'
import { ItemType } from '../types'

export class StoreMessageClient {
  /**
   * Retrieves a store message, i.e. a message containing a File.
   *
   * @param configuration The message hash and the API Server endpoint to make the query.
   */
  async get({ fileHash = '', apiServer = DEFAULT_API_V2 }: StoreGetConfiguration): Promise<ArrayBuffer> {
    const response = await axios.get<ArrayBuffer>(
      `${stripTrailingSlash(apiServer)}/api/v0/storage/raw/${fileHash}?find`,
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
    apiServer = DEFAULT_API_V2,
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
      (await pushFileToStorageEngine({
        apiServer,
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

    const builtMessage = buildStoreMessage({
      account,
      channel,
      timestamp,
      storageEngine,
      content: storeContent,
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      content: storeContent,
      inline: inlineRequested,
      apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: apiServer,
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
      apiServer: spc.apiServer || DEFAULT_API_V2,
      storageEngine: ItemType.ipfs,
    })
  }
}

export default StoreMessageClient
