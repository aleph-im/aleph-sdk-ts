import { useState } from "react";

import { consumeProps } from "../model/componentProps";
import { ECIESAccount } from "../../../../src/accounts/account";

type EncryptionFormType = {
    rawMessage: string;
    encryptedMessage: string | Buffer;
    decryptedMessage: string;
};

function EncryptionConfig({ state }: consumeProps) {
  const [encryptionContent, setEncryptionContent] = useState<EncryptionFormType>({
      encryptedMessage: "",
      decryptedMessage: "",
      rawMessage: "Did the quick brown fox jump over the lazy dog?!",
  })

  const handleChange = ( e: any ) => {
      setEncryptionContent({
          ...encryptionContent,
          [e.target.name as keyof typeof encryptionContent]: e.target.value,
      })
  }

  const cryptMessage = async () => {
    if (!(state.account instanceof ECIESAccount)) return;

    const encrypted = await state.account.encrypt(Buffer.from(encryptionContent.rawMessage))
    setEncryptionContent({...encryptionContent, encryptedMessage: encrypted})
  }

  const decryptMessage = async () => {
    if (!(state.account instanceof ECIESAccount) || !encryptionContent.encryptedMessage) return;

    const decrypted = await state.account.decrypt(encryptionContent.encryptedMessage)
    setEncryptionContent({...encryptionContent, decryptedMessage: decrypted.toString()})
  }


    return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
    <h2>Encryption</h2>

    <div>
      <input value={encryptionContent.rawMessage}
            size={55}
            onChange={handleChange}
            name="rawMessage"
      />

      <button onClick={async () => await cryptMessage()}>Encrypt</button>
    </div>
    <div>
        <input value={encryptionContent.encryptedMessage.toString('hex')}
               size={55}
               onChange={handleChange}
               name="encryptedMessage"
        />

        <button onClick={async () => await decryptMessage()}>Decrypt</button>
    </div>
    {
        encryptionContent.decryptedMessage !== "" && <p> <span style={{fontWeight: "bold"}}>Decrypted:</span> { encryptionContent.decryptedMessage } </p>
    }
    </div>
  )
}

export default EncryptionConfig