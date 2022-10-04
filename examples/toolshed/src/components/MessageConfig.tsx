import { useState } from "react";

import { consumeProps } from "../model/componentProps";

import { utils, messageType } from "@aleph-sdk-ts/core-base";
import { post } from "@aleph-sdk-ts/messages"

function MessageConfig({ state }: consumeProps) {
  const [messageHash, setMessageHash] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [messageContent, setMessageContent] = useState("Did the quick brown fox jump over the lazy dog?!")

  const handleChange = ( e: any ) => {
   setMessageContent(e.target.value)
  }

  const sendMessage = async () => {
    setMessageHash(null)
    setIsSending(true)

    const message = await post.Publish({
        APIServer: utils.constant.DEFAULT_API_V2,
        channel: "Typescript-SDK-Toolshed",
        inlineRequested: true,
        storageEngine: messageType.ItemType.ipfs,
        account: state.account,
        postType: "Toolshed",
        content: messageContent,
    })

    setMessageHash(message.item_hash)
    setIsSending(false)
  }

  return (
    <>
    <div>
      <input value={messageContent} 
            size={55}
            onChange={handleChange} />
      
      <button onClick={sendMessage} disabled={isSending}>Send</button>
    </div>
    {
      isSending && <p>Sending your message</p>
    }
    {
      messageHash &&
      <p>
        Your message was succesfully posted! <a href={`https://explorer.aleph.im/address/${state.account?.GetChain()}/${state.account?.address}/message/POST/${messageHash}`} target="_blank">Check on explorer</a>
      </p>
    }
    </>
  )
}

export default MessageConfig