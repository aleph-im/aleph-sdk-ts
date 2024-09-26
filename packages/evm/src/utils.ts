import { Decimal } from 'decimal.js'
import { BigNumber, utils } from 'ethers'

export function alephToWei(alephAmount: Decimal | number): BigNumber {
  // @note: Need to pre-multiply the number as Decimal in order to correctly parse as BigNumber
  const alephAmountBN = new Decimal(alephAmount).mul(10 ** 18)
  return BigNumber.from(alephAmountBN.toString())
}

export function weiToAleph(weiAmount: BigNumber | string): Decimal {
  return new Decimal(utils.formatEther(BigNumber.from(weiAmount)))
}

export const erc20Abi = [
  {
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    constant: true,
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]
