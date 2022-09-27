
import { ethereum } from "@aleph-sdk-ts/accounts-software-ethereum"
import { solana } from "@aleph-sdk-ts/accounts-software-solana"

import { WalletChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'


function WalletConfig({ dispatch, state } : dispatchAndConsume) {
  const getAccountClass = () => (
    state.selectedChain === WalletChains.Ethereum ? [ethereum, window.ethereum]
    : state.selectedChain === WalletChains.Solana ? [solana, window.phantom?.solana]
    : [null, null]
  )

  const connectToMetamask = async () => {
    const [_account, provider] = getAccountClass();

    if(_account === null)
      return 

    try{
      const account = await _account.GetAccountFromProvider(provider)
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
    <div>
      <button onClick={connectToMetamask}>Connect to Provider</button>
    </div>
  )
}

export default WalletConfig