import { Account, ECIESAccount } from "../../../src/accounts/account";
import { KeypairChains, WalletChains, HardwareChains } from "./model/chains";

export enum Actions {
    SELECT_CHAIN,
    SET_ACCOUNT,
}

export type ActionType = {
    type: Actions;
    payload: any;
};

export type AppStateType = {
    selectedChain: KeypairChains | WalletChains | HardwareChains;
    account: null | Account | ECIESAccount;
};

export const initState: AppStateType = {
    selectedChain: KeypairChains.Avalanche,
    account: null,
};

export const reducer = (state: AppStateType, action: ActionType): AppStateType => {
    switch (action.type) {
        case Actions.SELECT_CHAIN:
            return {
                ...state,
                selectedChain: action.payload,
                account: null,
            };

        case Actions.SET_ACCOUNT:
            return {
                ...state,
                account: action.payload,
            };

        default:
            return state;
    }
};
