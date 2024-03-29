import { WalletChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'
import Select, { SingleValue } from 'react-select'
import { useState } from 'react'
import { RpcId } from '../../../../packages/evm'
import * as avalanche from '../../../../packages/avalanche/src'
import * as ethereum from '../../../../packages/ethereum/src'
import * as substrate from '../../../../packages/substrate/src'
import * as solana from '../../../../packages/solana/src'

type Option = {
  readonly label: string
  readonly value: number
  readonly isDisabled?: boolean
}

const availableChains: Option[] = [
  { label: 'Ethereum Mainnet', value: RpcId.ETH },
  { label: 'Ethereum Mainnet (FLASHBOT)', value: RpcId.ETH_FLASHBOTS },
  { label: 'Avalanche Mainnet', value: RpcId.AVAX },
  { label: 'Polygon Mainnet', value: RpcId.POLYGON },
  { label: 'BSC Mainnet', value: RpcId.BSC },
]

function WalletConfig({ dispatch, state }: dispatchAndConsume) {
  const [customEndpoint, setCustomEndpoint] = useState<RpcId>(availableChains[0].value)
  const getAccountClass = () =>
    state.selectedChain === WalletChains.Avalanche
      ? [avalanche, window.ethereum]
      : state.selectedChain === WalletChains.Substrate
        ? [substrate, null]
        : state.selectedChain === WalletChains.Ethereum
          ? [ethereum, window.ethereum]
          : state.selectedChain === WalletChains.Solana
            ? [solana, window.phantom?.solana]
            : [null, null]

  const connectToMetamask = async () => {
    const [_account, provider] = getAccountClass()

    if (_account === null) return

    try {
      const account =
        state.selectedChain === WalletChains.Ethereum
          ? await _account.getAccountFromProvider(provider, customEndpoint)
          : await _account.getAccountFromProvider(provider)
      dispatch({
        type: Actions.SET_ACCOUNT,
        payload: account,
      })
    } catch (err) {
      alert(err)
    }
  }

  const handleChange = (x: SingleValue<Option>) => {
    if (x) setCustomEndpoint(x.value)
  }

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={async () => {
          await connectToMetamask()
        }}
      >
        Connect to Provider
      </button>
      {state.selectedChain === WalletChains.Ethereum && (
        <div>
          <Select options={availableChains} defaultValue={availableChains[0]} onChange={handleChange} />
        </div>
      )}
    </div>
  )
}

export default WalletConfig
