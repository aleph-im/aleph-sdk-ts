import axios from 'axios'
import { DEFAULT_API_V2 } from '../../global'
import { getSocketPath, stripTrailingSlash } from '../../utils/url'

type StoreGetConfiguration = {
  fileHash: string
  APIServer?: string
}

/**
 * Retrieves a store message, i.e. a message containing a File.
 *
 * @param configuration The message hash and the API Server endpoint to make the query.
 */
export async function Get({ fileHash = '', APIServer = DEFAULT_API_V2 }: StoreGetConfiguration): Promise<ArrayBuffer> {
  const response = await axios.get<ArrayBuffer>(
    `${stripTrailingSlash(APIServer)}/api/v0/storage/raw/${fileHash}?find`,
    {
      responseType: 'arraybuffer',
      socketPath: getSocketPath(),
    },
  )

  return response.data
}
