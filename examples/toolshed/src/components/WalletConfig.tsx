import {avalanche, ethereum, solana} from '../../../../src/accounts'
import {WalletChains} from '../model/chains'
import {dispatchAndConsume} from '../model/componentProps'
import {Actions} from '../reducer'
import {ChangeRpcParam, RpcChainType} from "../../../../src/accounts/providers/JsonRPCWallet";


function WalletConfig({ dispatch, state } : dispatchAndConsume) {
  const getAccountClass = () => (
    state.selectedChain === WalletChains.Avalanche ? [avalanche, window.ethereum]
    : state.selectedChain === WalletChains.Ethereum ? [ethereum, window.ethereum]
    : state.selectedChain === WalletChains.Solana ? [solana, window.phantom?.solana]
    : [null, null]
  )

  const connectToMetamask = async (endpoint?: ChangeRpcParam) => {
    const [_account, provider] = getAccountClass();

    if(_account === null)
      return 

    try{
      const account = endpoint ? await _account.GetAccountFromProvider(provider, endpoint) :
          await _account.GetAccountFromProvider(provider)
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
      <button onClick={async () => {await connectToMetamask()}}>Connect to Provider</button>
      {state.selectedChain === WalletChains.Ethereum && <button style={{'marginLeft': '4px'}}
          onClick={async () =>
            {await connectToMetamask(RpcChainType.ETH_FLASHBOTS);
      }}>
        Connect to Provider (Flashbots endpoint)
      </button> }
    </div>
  )
}

export default WalletConfig