import axios from 'axios'
import shajs from 'sha.js'
import FormDataNode from 'form-data'

import { getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { BaseMessage, ItemType } from '../types'

/**
 * message:         The message to update and then publish.
 *
 * content:         The message's content to put in the message.
 *
 * inline:          This param can't be filled by the user, it will force the message to be inline in case of size > MAX_SIZE
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
type PutConfiguration<T> = {
  inline?: boolean
  message: BaseMessage
  content: T
  APIServer: string
}

type PushConfiguration<T> = {
  content: T
  APIServer: string
  storageEngine: ItemType
}

type PushResponse = {
  hash: string
}

type PushFileConfiguration = {
  file: Buffer | Blob
  APIServer: string
  storageEngine: ItemType
}

/**
 * This function is used to update the Aleph message's fields and then publish it to the targeted storage engine.
 *
 * @param configuration The configuration used to update & publish the message.
 */
export async function PutContentToStorageEngine<T>(configuration: PutConfiguration<T>): Promise<void> {
  const serialized = JSON.stringify(configuration.content)
  const requestedStorageEngine = configuration.message.item_type

  if (Buffer.byteLength(serialized) < 50000 && (requestedStorageEngine === ItemType.inline || configuration.inline)) {
    configuration.message.item_content = serialized
    configuration.message.item_type = ItemType.inline
    configuration.message.item_hash = new shajs.sha256().update(serialized).digest('hex')
  } else {
    if (requestedStorageEngine === ItemType.inline) {
      console.warn(
        "Storage Engine warning: Due to the size of your message content, your message location was switch from 'inline' to 'storage' ",
      )
      configuration.message.item_type = ItemType.storage
    }
    configuration.message.item_content = undefined
    configuration.message.item_hash = await PushToStorageEngine<T>({
      content: configuration.content,
      APIServer: configuration.APIServer,
      storageEngine: configuration.message.item_type,
    })
  }
}

async function PushToStorageEngine<T>(configuration: PushConfiguration<T>): Promise<string> {
  const response = await axios.post<PushResponse>(
    `${stripTrailingSlash(configuration.APIServer)}/api/v0/${configuration.storageEngine.toLowerCase()}/add_json`,
    configuration.content,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      socketPath: getSocketPath(),
    },
  )
  return response.data.hash
}

export async function PushFileToStorageEngine(configuration: PushFileConfiguration): Promise<string> {
  const isBrowser = typeof FormData !== 'undefined'
  let form: FormDataNode | FormData

  if (isBrowser) {
    form = new FormData()
    form.append('file', new Blob([configuration.file]))
  } else {
    form = new FormDataNode()
    form.append('file', configuration.file, 'File')
  }
  const response = await axios.post<PushResponse>(
    `${stripTrailingSlash(configuration.APIServer)}/api/v0/${configuration.storageEngine.toLowerCase()}/add_file`,
    form,
    {
      headers: {
        'Content-Type': isBrowser ? undefined : `multipart/form-data; boundary=${(form as FormDataNode).getBoundary()}`,
      },
      socketPath: getSocketPath(),
    },
  )
  return response.data.hash
}
