import { ethereum } from '../../../../src/accounts/providers/Ledger'
import { HardwareChains } from '../model/chains'
import { dispatchAndConsume } from '../model/componentProps'
import { Actions } from '../reducer'


function HardwareConfig({ dispatch, state } : dispatchAndConsume) {
  const getAccountClass = () => (
    state.selectedChain === HardwareChains.Ethereum ? [ethereum, null]
    : [null, null]
  )

  const connectToHardware = async () => {
    const [_account, provider] = getAccountClass();

    if(_account === null)
      return 

    try{
      const account = await _account.GetAccountFromLedger()
      dispatch({
        type: Actions.SET_ACCOUNT,
        payload: account
      })
    }
    catch(err){
      alert(err)
    }
  }

  return (
    <div>
      <button onClick={connectToHardware}>Connect to Hardware</button>
    </div>
  )
}

export default HardwareConfig