import {useEffect, useState} from "react";
import {AlephWebSocket} from "../../../../src/messages/any/AlephWebSocket";
import {GetMessagesSocket} from "../../../../src/messages/any";
import {SocketResponse} from "../../../../src/messages/any/getMessagesSocket";

function WebSocket() {
  const [socket, setSocket] = useState<AlephWebSocket | undefined>()
  const [data, setData] = useState<SocketResponse[] | undefined>([]);

  const startSocket = () => {
    const newSocket = GetMessagesSocket({});
    setSocket(newSocket);
  }

  const displayContent = () => {
    setData(socket?.getData());
  }

  const clearSocket = () => {
    socket?.clearData();
    displayContent();
  }

  const closeSocket = () => {
    socket?.closeSocket()
    setSocket(undefined);
  }

  return (
    <>
    <div style={{display: 'flex', flexWrap:'wrap', gap: '6px'}}>
      <button onClick={startSocket} disabled={!!socket}>Open WebSocket</button>
      <button onClick={displayContent} disabled={!socket}>Display</button>
      <button onClick={clearSocket} disabled={!socket}>Clear Data</button>
      <button onClick={closeSocket} disabled={!socket}>Close Socket</button>
    </div>

    <div>
      { !!socket ? (<table style={{marginTop: '2em'}}>
        <thead>
          <tr>
            <th>Sender</th>
            <th>Chain</th>
            <th>Hash</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((line, id) => {
            return (
                <tr key={id}>
                  <td>{`${line.sender.substring(0, 6,)}...${line.sender.substring(line.sender.length - 4,)}`}</td>
                  <td>{line.chain}</td>
                  <td>{line.item_hash}</td>
                </tr>
            )
          })}
        </tbody>
      </table>) : (<p>Socket is closed</p>)}
    </div>
    </>
  )
}

export default WebSocket