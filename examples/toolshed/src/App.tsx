import { useCallback, useReducer } from 'react'

import BalanceConfig from './components/BalanceConfig'
import HardwareConfig from './components/HardwareConfig'
import KeypairConfig from './components/KeypairConfig'
import MessageConfig from './components/MessageConfig'
import SelectProvider from './components/SelectProvider'
import WalletConfig from './components/WalletConfig'
import WebSocket from './components/WebSocket'
import { HardwareChains, KeypairChains, WalletChains } from './model/chains'
import { initState, reducer } from './reducer'
import { ECIESAccount } from '../../../packages/account/src'
import { ChainMetadata, EVMAccount } from '../../../packages/evm/src'

function App() {
  const [state, dispatch] = useReducer(reducer, initState)
  const connectedChain = useCallback(
    () =>
      (state?.account as EVMAccount)?.selectedRpcId !== undefined
        ? `${ChainMetadata[(state.account as EVMAccount).selectedRpcId!].chainName}`
        : undefined,
    [state?.account],
  )

  const connection = () => {
    if (state.account) {
      return (
        <div>
          {connectedChain() ? (
            <>
              <p style={{ fontWeight: 'bold' }}>Connected to:</p>
              <span>{connectedChain()}</span>
            </>
          ) : null}
          <p style={{ fontWeight: 'bold' }}>Your address is:</p>
          <span>{state.account.address}</span>
          {state.account instanceof ECIESAccount && state.account.publicKey && (
            <>
              <p style={{ fontWeight: 'bold' }}>Your public key is:</p>
              <span>{state.account.publicKey}</span>
            </>
          )}
        </div>
      )
    }

    if (state.selectedChain.endsWith('_KP')) {
      return <KeypairConfig state={state} dispatch={dispatch} />
    } else if (state.selectedChain.endsWith('_HW')) {
      return <HardwareConfig state={state} dispatch={dispatch} />
    }

    return <WalletConfig state={state} dispatch={dispatch} />
  }

  return (
    <main>
      <h1>Aleph.im | Message toolshed</h1>

      <p>
        This tool provides an easy way to test messages using{' '}
        <a href="https://github.com/aleph-im/aleph-sdk-ts/">aleph-sdk-ts</a>.
      </p>

      <p>
        To get started, pick a Blockchain from the dropdown below. You can either use a Web3 provider such as Metamask
        or randomly generated Keypairs.
      </p>

      <section style={{ display: 'flex', flexWrap: 'wrap', margin: '25px 0' }}>
        <section className="halfpage">
          <h2>Chain</h2>
          <SelectProvider dispatch={dispatch} />
        </section>
        <section className="halfpage">
          <h2>Config</h2>
          {connection()}
        </section>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {state.account && <MessageConfig state={state} />}
        {state.account &&
          [
            HardwareChains.Ethereum,
            KeypairChains.Ethereum,
            KeypairChains.Avalanche,
            KeypairChains.Base,
            WalletChains.Ethereum,
            WalletChains.Avalanche,
            WalletChains.Base,
          ].includes(state.selectedChain) && <BalanceConfig state={state} dispatch={dispatch} />}
        <section
          style={{
            marginTop: '6em',
            borderStyle: 'solid',
            borderBottom: '0px',
            borderColor: 'lightgray',
            borderLeft: '0px',
            borderRight: '0px',
          }}
        >
          <h2>WebSocket</h2>
          <WebSocket />
        </section>
      </div>
    </main>
  )
}

export default App
