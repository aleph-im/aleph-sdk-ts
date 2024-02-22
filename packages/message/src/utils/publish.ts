import axios, { AxiosError } from 'axios'
import shajs from 'sha.js'
import FormDataNode from 'form-data'

import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import { BuiltMessage, HashedMessage, ItemType, MessageContent } from '../types'
import {InvalidMessageError} from "../types/errors";

/**
 * message:         The message to update and then publish.
 *
 * storageEngine:   The storage engine to used when storing the message (IPFS, Aleph storage or inline).
 *
 * apiServer:       The API server endpoint used to carry the request to the Aleph's network.
 */
type PutConfiguration<C extends MessageContent> = {
  message: BuiltMessage<C>
  apiServer?: string
}

type PushConfiguration<T> = {
  content: T
  apiServer: string
  storageEngine: ItemType
}

type PushResponse = {
  hash: string
}

type PushFileConfiguration = {
  file: Buffer | Uint8Array
  apiServer: string
  storageEngine: ItemType
}

/**
 * This function is used to update the Aleph message's fields and then publish it to the targeted storage engine.
 *
 * @param configuration The configuration used to update & publish the message.
 */
export async function prepareAlephMessage<C extends MessageContent>({
  message,
  apiServer = DEFAULT_API_V2,
}: PutConfiguration<C>): Promise<HashedMessage<C>> {
  const serialized = JSON.stringify(message.content)
  const requestedStorageEngine = message.item_type

  // @todo: Separate assignment and push to storage engine
  if (Buffer.byteLength(serialized) < 50000 && requestedStorageEngine === ItemType.inline) {
    return new HashedMessage<C>({
      ...message,
      item_content: serialized,
      item_type: ItemType.inline,
      // @todo: Replace with standard crypto library
      item_hash: new shajs.sha256().update(serialized).digest('hex'),
    })
  } else {
    if (requestedStorageEngine === ItemType.inline) {
      console.warn(
        "Storage Engine warning: Due to the size of your message content, your message location was switch from 'inline' to 'storage' ",
      )
      message.item_type = ItemType.storage
    }
    const hash = await pushJsonToStorageEngine({
      content: serialized,
      apiServer: apiServer as string,
      storageEngine: message.item_type,
    })
    return new HashedMessage<C>({
      ...message,
      item_content: undefined,
      item_hash: hash,
    })
  }
}

async function pushJsonToStorageEngine<T>(configuration: PushConfiguration<T>): Promise<string> {
  try {
    const response = await axios.post<PushResponse>(
      `${stripTrailingSlash(configuration.apiServer)}/api/v0/${configuration.storageEngine.toLowerCase()}/add_json`,
      configuration.content,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        socketPath: getSocketPath(),
      },
    )
    return response.data.hash
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const error = err as AxiosError
      throw new InvalidMessageError(error)
    }
    throw err
  }
}

export async function pushFileToStorageEngine(configuration: PushFileConfiguration): Promise<string> {
  const isBrowser = typeof FormData !== 'undefined'
  let form: FormDataNode | FormData

  if (isBrowser) {
    form = new FormData() as any
    form.append('file', new Blob([configuration.file]))
  } else {
    form = new FormDataNode()
    form.append('file', configuration.file, 'File')
  }
  const response = await axios.post<PushResponse>(
    `${stripTrailingSlash(configuration.apiServer)}/api/v0/${configuration.storageEngine.toLowerCase()}/add_file`,
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
