import { Decimal } from 'decimal.js'
import { formatEther, parseEther } from 'ethers'

export function alephToWei(alephAmount: Decimal | number): bigint {
  return parseEther(new Decimal(alephAmount).toFixed(18))
}

export function weiToAleph(weiAmount: bigint | string): Decimal {
  return new Decimal(formatEther(weiAmount))
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
