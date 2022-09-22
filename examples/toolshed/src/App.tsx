import { useReducer } from 'react'

import { initState, reducer } from './reducer'

import SelectProvider from './components/SelectProvider'
import KeypairConfig from './components/KeypairConfig'
import WalletConfig from './components/WalletConfig'
import MessageConfig from './components/MessageConfig'


function App() {
  const [state, dispatch] = useReducer(reducer, initState)
  
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
          { !state.account ?
            (state.selectedChain.endsWith('_KP') ?
            <KeypairConfig state={state} dispatch={dispatch} />
            : 
            <WalletConfig state={state} dispatch={dispatch} />
            )
            
            :

            <div>
              <p>Your address is:</p>
              <span>{state.account.address}</span>
            </div>

          }
        </section>
      </section>

      {
        state.account &&
        <MessageConfig state={state} />
      }
    </main>
  )
}

export default App
