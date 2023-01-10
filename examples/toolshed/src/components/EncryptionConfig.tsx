import { useState } from "react";

import { consumeProps } from "../model/componentProps";
import {ECIESAccount} from "../../../../src/accounts/account";

type EncyrptionFormType = {
    rawMessage: string;
    encryptedMessage: Buffer | string;
    decryptedMessage: string;
};

function EncryptionConfig({ state }: consumeProps) {
  const [encryptionContent, setEncryptionContent] = useState<EncyrptionFormType>({
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
    setEncryptionContent({...encryptionContent, encryptedMessage: ""})

    const crypted = await state.account.encrypt(Buffer.from(encryptionContent.rawMessage))
    setEncryptionContent({...encryptionContent, encryptedMessage: crypted.toString("hex")})
  }

  const decryptMessage = async () => {
    if (!(state.account instanceof ECIESAccount)) return;
    setEncryptionContent({...encryptionContent, decryptedMessage: ""})

    const decrypted = await state.account.decrypt(Buffer.from(encryptionContent.rawMessage, "hex"))
    setEncryptionContent({...encryptionContent, decryptedMessage: decrypted.toString("hex")})
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
        <input value={encryptionContent.encryptedMessage.toString()}
               size={55}
               onChange={handleChange}
               name="encryptedMessage"
        />

        <button onClick={async () => await decryptMessage()}>Decrypt</button>
    </div>
    {
        encryptionContent.decryptedMessage !== "" && <p>encryptionContent.decryptedMessage </p>
    }
    </div>
  )
}

export default EncryptionConfig