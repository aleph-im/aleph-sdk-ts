import { DEFAULT_API_WS_V2, isNode } from '@aleph-sdk/core'

import { AlephNodeWebSocket } from './alephNodeWebSocket'
import { AlephWebSocket } from './alephWebSocket'
import { AlephSocket, GetMessagesSocketConfiguration, GetMessagesSocketParams } from './types'

/**
 * Retrieves all incoming messages by opening a WebSocket.
 * Messages can be filtered with the params.
 *
 * @param configuration The message params to make the query.
 */
export function getMessagesSocket({
  addresses = [],
  channels = [],
  chains = [],
  refs = [],
  tags = [],
  contentTypes = [],
  contentKeys = [],
  hashes = [],
  messageType,
  startDate,
  endDate,
  history,
  apiServer = DEFAULT_API_WS_V2,
}: GetMessagesSocketConfiguration): AlephSocket {
  const params: GetMessagesSocketParams = {
    addresses: addresses.join(',') || undefined,
    channels: channels.join(',') || undefined,
    chains: chains.join(',') || undefined,
    refs: refs.join(',') || undefined,
    tags: tags.join(',') || undefined,
    contentTypes: contentTypes.join(',') || undefined,
    contentKeys: contentKeys.join(',') || undefined,
    hashes: hashes.join(',') || undefined,
    msgType: messageType || undefined,
    startDate: startDate ? startDate.valueOf() / 1000 : undefined,
    endDate: endDate ? endDate.valueOf() / 1000 : undefined,
    history: history || undefined,
  }

  if (isNode()) return new AlephNodeWebSocket(params, apiServer)
  else return new AlephWebSocket(params, apiServer)
}
