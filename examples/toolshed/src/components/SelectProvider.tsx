import Select, { SingleValue } from 'react-select'
import {HardwareChains, KeypairChains, WalletChains} from '../model/chains'
import { dispatchProps } from '../model/componentProps'
import { Actions } from '../reducer'

type Option = {
  readonly label: string
  readonly value: string
  readonly isDisabled?: boolean
}


export const availableKeypairs: Option[] = [
  { label: 'Avalanche', value: KeypairChains.Avalanche },
  { label: 'Cosmos', value: 'CSDK_KP' },
  { label: 'Ethereum', value: KeypairChains.Ethereum },
  { label: 'NULS2', value: KeypairChains.NULS2 },
  { label: 'Polkadot/Substrate', value: KeypairChains.Polkadot },
  { label: 'Solana', value: KeypairChains.Solana },
  { label: 'Tezos', value: KeypairChains.Tezos },
]

export const availableWallets: Option[] = [
  { label: 'Ethereum (via Metamask)', value: WalletChains.Ethereum },
  { label: 'Solana (via Phantom)', value: WalletChains.Solana },
]

export const availableHardware: Option[] = [
  { label: 'Ethereum (via Ledger)', value: HardwareChains.Ethereum },
]

export const options = [
  { label: 'Hardware', options: availableHardware },
  { label: 'Wallets', options: availableWallets },
  { label: 'Keypairs', options: availableKeypairs },
]

function SelectProvider({dispatch}: dispatchProps) {
  const handleChange = (x: SingleValue<Option> ) => { 
    dispatch({
      type: Actions.SELECT_CHAIN,
      payload: x?.value
    })
  }

  return (
    <div>
      <Select options={options} 
              defaultValue={availableKeypairs[0]}
              onChange={handleChange} />
    </div>
  )
}

export default SelectProvider