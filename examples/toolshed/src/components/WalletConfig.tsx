import { avalanche, ethereum, solana } from '../../../../src/accounts'
import { WalletChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'
import { RpcChainType } from "../../../../src/accounts/providers/JsonRPCWallet";
import Select, { SingleValue } from "react-select";
import { useState } from "react";

type Option = {
  readonly label: string
  readonly value: number
  readonly isDisabled?: boolean
}

const availableChains: Option[] = [
  { label: 'Ethereum Mainnet', value: RpcChainType.ETH },
  { label: 'Ethereum Mainnet (FLASHBOT)', value: RpcChainType.ETH_FLASHBOTS },
  { label: 'Avalanche Mainnet', value: RpcChainType.AVAX },
  { label: 'Polygon Mainnet', value: RpcChainType.POLYGON },
  { label: 'BSC Mainnet', value: RpcChainType.BSC },
]

function WalletConfig({ dispatch, state } : dispatchAndConsume) {
  const [customEndpoint, setCustomEndpoint] = useState<RpcChainType>(availableChains[0].value)
  const getAccountClass = () => (
    state.selectedChain === WalletChains.Avalanche ? [avalanche, window.ethereum]
    : state.selectedChain === WalletChains.Ethereum ? [ethereum, window.ethereum]
    : state.selectedChain === WalletChains.Solana ? [solana, window.phantom?.solana]
    : [null, null]
  )

  const connectToMetamask = async () => {
    const [_account, provider] = getAccountClass();

    if(_account === null)
      return 

    try{
      const account = state.selectedChain === WalletChains.Ethereum ? await _account.GetAccountFromProvider(provider, customEndpoint) :
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

  const handleChange = (x: SingleValue<Option> ) => {
    if (!!x) setCustomEndpoint(x.value);
  }

  return (
    <div style={{display: 'flex', gap: '12px'}}>
      <button
        onClick={async () => {await connectToMetamask()}}>
        Connect to Provider
      </button>
      {state.selectedChain === WalletChains.Ethereum && (
          <div>
            <Select options={availableChains}
                    defaultValue={availableChains[0]}
                    onChange={handleChange} />
          </div>
      )}
    </div>
  )
}

export default WalletConfig