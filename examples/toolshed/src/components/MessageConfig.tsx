import { useState } from 'react'

import { Account } from '../../../../packages/account/src'
import { AuthenticatedAlephHttpClient } from '../../../../packages/client/src'
import { ItemType } from '../../../../packages/message/src'
import { consumeProps } from '../model/componentProps'

function MessageConfig({ state }: consumeProps) {
  const [messageHash, setMessageHash]: [string | null, any] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [messageContent, setMessageContent] = useState('Did the quick brown fox jump over the lazy dog?!')
  const client = new AuthenticatedAlephHttpClient(state.account as Account)

  const handleChange = (e: any) => {
    setMessageContent(e.target.value)
  }

  const sendMessage = async () => {
    setMessageHash(null)
    setIsSending(true)

    if (!state.account) return alert('No account selected')

    const message = await client.createPost({
      channel: 'Typescript-SDK-Toolshed',
      storageEngine: ItemType.inline,
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
