// Type-only import: erased at emit, so browser bundlers walking the import
// graph never see a static reference to the Node-only `ws` package.
import type WebSocket from 'ws'

import { GetMessagesSocketParams, SocketResponse } from './types'

export type WebSocketCtor = typeof WebSocket

/**
 * This class is used to manipulate Node Web Socket to list Aleph Messages
 */
export class AlephNodeWebSocket {
  private readonly socket: WebSocket
  private data: SocketResponse[]

  private isOpen: boolean

  constructor(queryParam: GetMessagesSocketParams, apiServer: string, WebSocketCtor: WebSocketCtor) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    this.isOpen = false
    this.data = []
    let queryParamString = ''

    Object.entries(queryParam).forEach(([key, value]) => {
      if (value) queryParamString = queryParamString + `&${key}=${value}`
    })
    if (queryParamString) queryParamString = queryParamString.substring(1)
    this.socket = new WebSocketCtor(`${apiServer}/api/ws0/messages?${queryParamString}`)

    // ON OPEN SOCKET
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.socket.on('open', function open() {
      console.log('[Aleph-NodeWebSocket] Connection established')
      self.isOpen = true
    })

    // ON RECEIVE DATA
    this.socket.on('message', function message(data) {
      self.data.push(JSON.parse(data.toString()))
    })

    // ON CLOSE SOCKET
    this.socket.on('close', function close() {
      console.log(`[Aleph-NodeWebSocket] Connection closed`)
      self.isOpen = false
    })

    // ON ERROR
    this.socket.on('error', console.error)
  }

  public getData = (): SocketResponse[] => {
    return this.data
  }
  public getSocket = (): WebSocket => {
    return this.socket
  }

  public getIsOpen = (): boolean => {
    return this.isOpen
  }

  public clearData = (): void => {
    this.data = []
  }

  public closeSocket = (): void => {
    this.socket.close(1000, 'Work complete')
  }
}
