import { useState } from 'react'

import { consumeProps } from '../model/componentProps'
import {ItemType, PostMessageClient} from "../../../../packages/message";

function MessageConfig({ state }: consumeProps) {
  const [messageHash, setMessageHash]: [string | null, any] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [messageContent, setMessageContent] = useState('Did the quick brown fox jump over the lazy dog?!')
  const postClient = new PostMessageClient()

  const handleChange = (e: any) => {
    setMessageContent(e.target.value)
  }

  const sendMessage = async () => {
    setMessageHash(null)
    setIsSending(true)

    if (!state.account) return alert('No account selected')

    const message = await postClient.send({
      channel: 'Typescript-SDK-Toolshed',
      storageEngine: ItemType.inline,
      account: state.account,
      postType: 'Toolshed',
      content: messageContent,
    })

    setMessageHash(message.item_hash)
    setIsSending(false)
  }

  return (
    <div>
      <h2>Sending</h2>
      <div>
        <input value={messageContent} size={55} onChange={handleChange} />

        <button onClick={sendMessage} disabled={isSending}>
          Send
        </button>
      </div>
      {isSending && <p>Sending your message</p>}
      {messageHash && (
        <p>
          Your message was succesfully posted!{' '}
          <a
            href={`https://explorer.aleph.im/address/${state.account?.getChain()}/${state.account?.address}/message/POST/${messageHash}`}
            target="_blank"
          >
            Check on explorer
          </a>
        </p>
      )}
    </div>
  )
}

export default MessageConfig
