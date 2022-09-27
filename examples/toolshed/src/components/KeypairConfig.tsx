import { useState } from 'react';
import { KeypairChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'

import { ethereum } from "@aleph-sdk-ts/accounts-software-ethereum"
import { solana } from "@aleph-sdk-ts/accounts-software-solana"
import { substrate } from "@aleph-sdk-ts/accounts-software-substrate"
import { nuls2 } from "@aleph-sdk-ts/accounts-software-nul2"
import { avalanche } from "@aleph-sdk-ts/accounts-software-avalanche"

function KeypairConfig({state, dispatch} : dispatchAndConsume) {
  const [mnemonicOrPk, setMnemonicOrPk] = useState('');

  const _account = (() => (
      state.selectedChain === KeypairChains.Avalanche ? avalanche
          : state.selectedChain === KeypairChains.Ethereum ? ethereum
              : state.selectedChain === KeypairChains.NULS2 ? nuls2
                  : state.selectedChain === KeypairChains.Polkadot ? substrate
                      : state.selectedChain === KeypairChains.Solana ? solana
                          : null
  ))()

  const getKeypair = async () => {
    if(_account === null)
      return console.error('Internal error')

    const { account } = await _account.NewAccount()
    dispatch({
      type: Actions.SET_ACCOUNT,
      payload: account
    })
  }

  const importAccount = async () => {
    if(!_account)
      return

    let method = _account.ImportAccountFromPrivateKey

    if(mnemonicOrPk.match(' ')){
      if(!_account.ImportAccountFromMnemonic)
        return alert('This account cannot be imported from a mnemonic')

      method = _account.ImportAccountFromMnemonic
    }
    try{
      const account = await method(mnemonicOrPk);
      dispatch({
        type: Actions.SET_ACCOUNT,
        payload: account
      })
    }
    catch(err){
      alert(err)
    }
  }

  return (
      <section>
        <button onClick={getKeypair}>Get a new random keypair</button>
        <div>
          <input type="text" value={mnemonicOrPk} onChange={e => setMnemonicOrPk(e.target.value)} />
          <button onClick={importAccount}>Retrieve from mnemonic/private key</button>
        </div>
      </section>
  )
}

export default KeypairConfig