import { useCallback, useState } from 'react'
import Select, { type SingleValue } from 'react-select'

import * as avalanche from '../../../../packages/avalanche/src'
import * as base from '../../../../packages/base/src'
import * as ethereum from '../../../../packages/ethereum/src'
import { RpcId } from '../../../../packages/evm/src'
import * as solana from '../../../../packages/solana/src'
import * as substrate from '../../../../packages/substrate/src'
import { WalletChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'

type Option = {
  readonly label: string
  readonly value: number
  readonly isDisabled?: boolean
}

const availableChains: Option[] = [
  { label: 'Ethereum Mainnet', value: RpcId.ETH },
  { label: 'Ethereum Mainnet (FLASHBOT)', value: RpcId.ETH_FLASHBOTS },
  { label: 'Ethereum Sepolia (Testnet)', value: RpcId.ETH_SEPOLIA },
  { label: 'Avalanche Mainnet', value: RpcId.AVAX },
  { label: 'Avalanche Fuji (Testnet)', value: RpcId.AVAX_TESTNET },
  { label: 'Base Mainnet', value: RpcId.BASE },
  { label: 'Base Sepolia (Testnet)', value: RpcId.BASE_TESTNET },
  { label: 'Polygon Mainnet', value: RpcId.POLYGON },
  { label: 'BSC Mainnet', value: RpcId.BSC },
]

function WalletConfig({ state, dispatch }: dispatchAndConsume) {
  const [rpcId, setRpcId] = useState<RpcId>(availableChains[0].value)

  const getAccountClass = () =>
    state.selectedChain === WalletChains.Solana
      ? [solana, window.phantom?.solana]
      : state.selectedChain === WalletChains.Substrate
        ? [substrate, null]
        : [RpcId.AVAX, RpcId.AVAX_TESTNET].includes(rpcId)
          ? [avalanche, window.ethereum]
          : [RpcId.BASE, RpcId.BASE_TESTNET].includes(rpcId)
            ? [base, window.ethereum]
            : [ethereum, window.ethereum]

  const connectToMetamask = useCallback(async () => {
    const [_account, provider] = getAccountClass()
    if (_account === null) return

    try {
      const account = await _account.getAccountFromProvider(provider, rpcId)
      dispatch({
        type: Actions.SET_ACCOUNT,
        payload: account,
      })
    } catch (err) {
      alert(err)
    }
  }, [rpcId])

  const handleChange = (x: SingleValue<Option>) => {
    if (x) setRpcId(x.value)
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
