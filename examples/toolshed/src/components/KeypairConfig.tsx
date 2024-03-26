import { useState } from 'react'
import * as ethereum from '../../../../packages/ethereum/src'
import * as avalanche from '../../../../packages/avalanche/src'
import * as substrate from '../../../../packages/substrate/src'
import * as solana from '../../../../packages/solana/src'
import * as nuls2 from '../../../../packages/nuls2/src'
import { KeypairChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'

function KeypairConfig({ state, dispatch }: dispatchAndConsume) {
  const [mnemonicOrPk, setMnemonicOrPk] = useState('')

  const _account = (() =>
    state.selectedChain === KeypairChains.Avalanche
      ? avalanche
      : state.selectedChain === KeypairChains.Ethereum
        ? ethereum
        : state.selectedChain === KeypairChains.NULS2
          ? nuls2
          : state.selectedChain === KeypairChains.Polkadot
            ? substrate
            : state.selectedChain === KeypairChains.Solana
              ? solana
              : null)()

  const getKeypair = async () => {
    if (_account === null) return console.error('Internal error')

    const { account } = await _account.newAccount()
    dispatch({
      type: Actions.SET_ACCOUNT,
      payload: account,
    })
  }

  const importAccount = async () => {
    if (!_account) return

    let method = _account.importAccountFromPrivateKey

    if (mnemonicOrPk.match(' ')) {
      // @ts-expect-error: There might be accounts for which this function isn't implemented.
      if (!_account.importAccountFromMnemonic) return alert('This account cannot be imported from a mnemonic')

      // @ts-expect-error: There might be accounts for which this function isn't implemented.
      method = _account.importAccountFromMnemonic
    }
    try {
      // @ts-expect-error: There might be accounts for which this function isn't implemented.
      const account = await method(mnemonicOrPk)
      dispatch({
        type: Actions.SET_ACCOUNT,
        payload: account,
      })
    } catch (err) {
      alert(err)
    }
  }

  return (
    <section>
      <button onClick={getKeypair}>Get a new random keypair</button>
      <div>
        <input type="text" value={mnemonicOrPk} onChange={(e) => setMnemonicOrPk(e.target.value)} />
        <button onClick={importAccount}>Retrieve from mnemonic/private key</button>
      </div>
    </section>
  )
}

export default KeypairConfig
