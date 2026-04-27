import { DEFAULT_API_WS_V2, isNode } from '@aleph-sdk/core'

import { AlephNodeWebSocket } from './alephNodeWebSocket'
import { AlephWebSocket } from './alephWebSocket'
import { AlephSocket, GetMessagesSocketConfiguration, GetMessagesSocketParams } from './types'

/**
 * Retrieves all incoming messages by opening a WebSocket.
 * Messages can be filtered with the params.
 *
 * In Node, the `ws` package is loaded lazily via a dynamic import so that
 * browser bundlers walking this module's static import graph never pull in
 * Node-only dependencies.
 *
 * @param configuration The message params to make the query.
 */
export async function getMessagesSocket({
  addresses = [],
  channels = [],
  chains = [],
  refs = [],
  tags = [],
  contentTypes = [],
  contentKeys = [],
  hashes = [],
  messageType,
  paymentTypes = [],
  startDate,
  endDate,
  history,
  apiServer = DEFAULT_API_WS_V2,
}: GetMessagesSocketConfiguration): Promise<AlephSocket> {
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
    paymentTypes: paymentTypes.join(',') || undefined,
    startDate: startDate ? startDate.valueOf() / 1000 : undefined,
    endDate: endDate ? endDate.valueOf() / 1000 : undefined,
    history: history || undefined,
  }

  if (isNode()) {
    const { default: WebSocket } = await import('ws')
    return new AlephNodeWebSocket(params, apiServer, WebSocket)
  }
  return new AlephWebSocket(params, apiServer)
}
