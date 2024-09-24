import { useEffect, useState } from 'react'

import * as avalanche from '../../../../packages/avalanche/src'
import * as base from '../../../../packages/base/src'
import * as ethereum from '../../../../packages/ethereum/src'
import { EVMAccount, RpcId } from '../../../../packages/evm/src'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'

function BalanceConfig({ state, dispatch }: dispatchAndConsume) {
  const [balance, setBalance] = useState(-1)
  const evmAccount = state.account as EVMAccount

  useEffect(() => {
    if (!evmAccount.address) setBalance(-2)
    else
      evmAccount
        .getALEPHBalance()
        .then(Number)
        .then(setBalance)
        .catch(async (err) => {
          console.error(err)
          if (err.message.startsWith('No token address found')) setBalance(-2)
          else if (err.message.startsWith('underlying network changed')) {
            const rpcId = evmAccount.selectedRpcId!
            const _account = [RpcId.AVAX, RpcId.AVAX_TESTNET].includes(rpcId)
              ? avalanche
              : [RpcId.BASE, RpcId.BASE_TESTNET].includes(rpcId)
                ? base
                : ethereum
            dispatch({
              type: Actions.SET_ACCOUNT,
              payload: await _account.getAccountFromProvider(window.ethereum as any, rpcId),
            })
          } else {
            setBalance(-3)
            console.error(err)
          }
        })
  }, [evmAccount])

  return (
    <div>
      <h2>
        ALEPH Balance:{' '}
        {balance >= 0
          ? balance.toString()
          : balance === -1
            ? 'Loading...'
            : balance === -2
              ? 'No token address on this chain'
              : 'Error'}
      </h2>
    </div>
  )
}

export default BalanceConfig
