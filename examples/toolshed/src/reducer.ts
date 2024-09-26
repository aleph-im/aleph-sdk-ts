import { HardwareChains, KeypairChains, WalletChains } from './model/chains'
import { Account, ECIESAccount } from '../../../packages/account/src'
import { EVMAccount } from '../../../packages/evm/src'

export enum Actions {
  SELECT_CHAIN,
  SET_ACCOUNT,
}

export type ActionType = {
  type: Actions
  payload: any
}

export type AppStateType = {
  selectedChain: KeypairChains | WalletChains | HardwareChains
  account?: Account | ECIESAccount | EVMAccount
}

export const initState: AppStateType = {
  selectedChain: KeypairChains.Ethereum,
  account: undefined,
}

export const reducer = (state: AppStateType, action: ActionType): AppStateType => {
  switch (action.type) {
    case Actions.SELECT_CHAIN:
      return {
        ...state,
        selectedChain: action.payload,
        account: undefined,
      }

    case Actions.SET_ACCOUNT:
      return {
        ...state,
        account: action.payload,
      }

    default:
      return state
  }
}
