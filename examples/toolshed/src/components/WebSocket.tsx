import { useState } from 'react'

import { AlephSocket, BaseMessageClient, SocketResponse } from '../../../../packages/message/src/base'

function WebSocket() {
  const [socket, setSocket] = useState<AlephSocket | undefined>()
  const [data, setData] = useState<SocketResponse[]>([])
  const client = new BaseMessageClient()

  const startSocket = async () => {
    const newSocket = client.getMessagesSocket({})

    setSocket(newSocket)
  }

  const displayContent = async () => {
    if (!socket) return
    setData([...socket.getData()])
  }

  const clearSocket = async () => {
    socket?.clearData()
    await displayContent()
  }

  const closeSocket = async () => {
    socket?.closeSocket()
    setSocket(undefined)
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <button onClick={startSocket} disabled={!!socket}>
          Open WebSocket
        </button>
        <button onClick={displayContent} disabled={!socket}>
          Display
        </button>
        <button onClick={clearSocket} disabled={!socket}>
          Clear Data
        </button>
        <button onClick={closeSocket} disabled={!socket}>
          Close Socket
        </button>
      </div>

      <p>Total: {data.length}</p>
      <div>
        {socket ? (
          <table style={{ marginTop: '2em' }}>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Chain</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {data.map((line, id) => {
                return (
                  <tr key={id}>
                    <td>{`${line.sender.substring(0, 6)}...${line.sender.substring(line.sender.length - 4)}`}</td>
                    <td>{line.chain}</td>
                    <td>{line.item_hash}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p>Socket is closed</p>
        )}
      </div>
    </>
  )
}

export default WebSocket
