import * as accounts from '../../../../src/accounts'
import { KeypairChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'

function KeypairConfig({state, dispatch} : dispatchAndConsume) {
  const getAccountClass = () => (
    state.selectedChain === KeypairChains.Avalanche ? accounts.avalanche
    : state.selectedChain === KeypairChains.Ethereum ? accounts.ethereum
    : state.selectedChain === KeypairChains.NULS ? accounts.nuls 
    : state.selectedChain === KeypairChains.NULS2 ? accounts.nuls2
    : state.selectedChain === KeypairChains.Polkadot ? accounts.substrate
    : state.selectedChain === KeypairChains.Solana ? accounts.solana
    : null
  )
  
  const getKeypair = async () => {
    const _account = getAccountClass()  
    if(_account === null)
      return console.error('Internal error')
    
    const { account } = await _account.NewAccount()
    dispatch({
      type: Actions.SET_ACCOUNT,
      payload: account
    })
  }

  const importAccount = () => {}
  
  return (
    <section>
      <button onClick={getKeypair}>Get a new random keypair</button>
      <div>
        <input type="text" />
        <button onClick={importAccount}>Retrieve from mnemonic/private key</button>
      </div>
    </section>
  )
}

export default KeypairConfig