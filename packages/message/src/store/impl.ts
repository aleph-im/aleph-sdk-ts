import { Account } from '@aleph-sdk/account'
import { DEFAULT_API_V2, getSocketPath, RequireOnlyOne, stripTrailingSlash } from '@aleph-sdk/core'
import axios, { type AxiosResponse } from 'axios'

import { StoreContent, StorePinConfiguration, StorePublishConfiguration } from './types'
import { HashedMessage, ItemType, SignedMessage, StoreMessage } from '../types'
import { blobToBuffer, calculateSHA256Hash } from './utils'
import { InvalidMessageError } from '../types/errors'
import { buildStoreMessage } from '../utils/messageBuilder'
import { prepareAlephMessage, pushFileToStorageEngine } from '../utils/publish'
import { broadcast } from '../utils/signature'

export class StoreMessageClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Retrieves a file from the network.
   *
   * @param fileHash The item_hash of the STORE message of the file to retrieve.
   */
  async download(fileHash: string): Promise<ArrayBuffer> {
    const response = (await axios.get<ArrayBuffer>(`${this.apiServer}/api/v0/storage/raw/${fileHash}?find`, {
      responseType: 'arraybuffer',
      socketPath: getSocketPath(),
    })) as AxiosResponse<ArrayBuffer>

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
    storageEngine = ItemType.storage,
    channel,
    fileHash,
    fileObject,
    extraFields,
    metadata,
    sync = false,
  }: RequireOnlyOne<StorePublishConfiguration, 'fileObject' | 'fileHash'>): Promise<StoreMessage> {
    if (!fileObject && !fileHash) throw new Error('You need to specify a File to upload or a Hash to pin.')
    if (fileObject && fileHash) throw new Error("You can't pin a file and upload it at the same time.")
    if (fileHash && storageEngine !== ItemType.ipfs) throw new Error('You must choose ipfs to pin the file.')

    let hash: string | undefined = fileHash
    if (!hash) {
      const buffer = await this.processFileObject(fileObject)
      hash = await this.getHash(buffer, storageEngine, fileHash, this.apiServer)
      if (fileObject instanceof File) {
        fileObject = new File([buffer], fileObject.name)
      } else {
        fileObject = new Blob([buffer])
      }
    }
    const timestamp = Date.now() / 1000
    const storeContent: StoreContent = {
      address: account.address,
      item_type: storageEngine,
      item_hash: hash,
      time: timestamp,
      extra_fields: extraFields,
      metadata,
    }

    const builtMessage = buildStoreMessage({
      channel,
      content: storeContent,
      account,
      storageEngine: ItemType.inline,
      timestamp,
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      apiServer: this.apiServer,
    })

    if (ItemType.ipfs == storageEngine) {
      const { message } = await broadcast({
        message: hashedMessage,
        account,
        apiServer: this.apiServer,
        sync,
      })
      return message
    } else if (!fileObject) {
      throw new Error('You need to specify a File to upload or a Hash to pin.')
    } else {
      const { message } = await this.uploadStore(hashedMessage, account, fileObject as Blob | File, sync || false)
      return message
    }
  }

  protected async getHash(
    buffer: Buffer | Uint8Array,
    storageEngine: ItemType,
    fileHash: string | undefined,
    apiServer: string,
  ) {
    if (buffer && storageEngine !== ItemType.ipfs) {
      const hash = calculateSHA256Hash(buffer)
      if (hash === null || hash === undefined) {
        throw new Error('Cannot process file')
      }
      return hash
    } else if (buffer && storageEngine === ItemType.ipfs) {
      return await pushFileToStorageEngine({
        apiServer,
        storageEngine,
        file: buffer,
      })
    } else if (fileHash) {
      return fileHash
    } else {
      throw new Error('Error with File Hash')
    }
  }

  protected async processFileObject(
    fileObject: Blob | Buffer | File | Uint8Array | null | undefined,
  ): Promise<Buffer | Uint8Array> {
    if (!fileObject) {
      throw new Error('fileObject is null')
    }

    if (fileObject instanceof Buffer || fileObject instanceof Uint8Array) {
      return fileObject
    }

    return await blobToBuffer(fileObject)
  }

  protected async uploadStore(
    message: HashedMessage<StoreContent>,
    account: Account,
    file: Blob | File,
    sync: boolean,
  ): Promise<{ message: SignedMessage<StoreContent>; response: { status: string; hash: string } }> {
    const form = new FormData()
    const signedMessage = new SignedMessage<StoreContent>({
      ...message,
      signature: await account.sign(message),
    })
    const metadata = {
      message: signedMessage.getBroadcastable(),
      sync,
    }
    form.append('metadata', JSON.stringify(metadata))
    form.append('file', file)
    try {
      const response = await axios.post(`${this.apiServer}/api/v0/storage/add_file`, form, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        socketPath: getSocketPath(),
      })
      return {
        message: signedMessage,
        response: response.data,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new InvalidMessageError(error)
      }
      throw error
    }
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
      storageEngine: ItemType.ipfs,
    })
  }
}

export default StoreMessageClient
