export enum Blockchain {
  DOT = 'DOT',
  ETH = 'ETH',
  SOL = 'SOL',
  NULS = 'NULS',
  NULS2 = 'NULS2',
  AVAX = 'AVAX',
  CSDK = 'CSDK',
  NEO = 'NEO',
  TEZOS = 'TEZOS',
}

/**
 * This type implementation allows to specify for a given T type two field with only one that have to be field.
 * You can find more about this here: https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-certificates/requireatleastone?view=azure-node-latest
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]
