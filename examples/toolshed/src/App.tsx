import { useReducer } from 'react'

import { initState, reducer } from './reducer'

import SelectProvider from './components/SelectProvider'
import KeypairConfig from './components/KeypairConfig'
import WalletConfig from './components/WalletConfig'
import MessageConfig from './components/MessageConfig'
import EncryptionConfig from "./components/EncryptionConfig";
import HardwareConfig from "./components/HardwareConfig";
import {ECIESAccount} from "../../../src/accounts/account";


function App() {
  const [state, dispatch] = useReducer(reducer, initState)

    const connection = () => {
      if (state.account) {
          return (
              <div>
                  <p style={{fontWeight: "bold"}}>Your address is:</p>
                  <span>{state.account.address}</span>
                  {state.account instanceof ECIESAccount && (
                      <>
                        <p style={{fontWeight: "bold"}}>Your public key is:</p>
                        <span>{state.account.publicKey}</span>
                      </>
                  )}
              </div>
          )
      }

      if (state.selectedChain.endsWith('_KP')) {
          return (<KeypairConfig state={state} dispatch={dispatch} />)
      } else if (state.selectedChain.endsWith('_HW')) {
          return (<HardwareConfig state={state} dispatch={dispatch} />)
      }
      
      return (<WalletConfig state={state} dispatch={dispatch} />)
    }

  return (
    <main>
      <h1>Aleph.im | Message toolshed</h1>

      <p>This tool provides an easy way to test messages using <a href="https://github.com/aleph-im/aleph-sdk-ts/">aleph-sdk-ts</a>.</p>

      <p>To get started, pick a Blockchain from the dropdown below. You can either use a Web3 provider such as Metamask or randomly generated Keypairs.</p>

      <section style={{display: 'flex', flexWrap:'wrap', margin: '25px 0'}}>
        <section className="halfpage">
          <h2>Chain</h2>
          <SelectProvider dispatch={dispatch} />
        </section>
        <section className="halfpage">
         <h2>Config</h2>
            { connection() }
        </section>
      </section>

    <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
      {
        state.account &&
        <MessageConfig state={state} />
      }
      {
        state.account && state.account instanceof ECIESAccount &&
        <EncryptionConfig state={state} />
      }
    </div>


    </main>
  )
}

export default App
