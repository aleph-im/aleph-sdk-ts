import React, {useEffect} from 'react';
import {DEFAULT_API_V2, store} from "aleph-sdk-ts";
import {ethereum} from "aleph-sdk-ts/accounts";
import {StorageEngine} from "aleph-sdk-ts/messages/message";

function App() {
  useEffect(() => {
    (async () => {
      const account = ethereum.NewAccount();
      console.log(account.address);

      const file = new File(
          ["This is just a test v2."],
          "test.txt",
          {
            type: "text/plain"
          }
      );

      const confirmation = await store.Publish({
        channel: "TEST",
        account: account,
        fileObject: file,
        storageEngine: StorageEngine.STORAGE,
        APIServer: DEFAULT_API_V2,
      });

      console.log(confirmation)
    })();
  }, []);
  return (
      <div>
    </div>
  );
}

export default App;
