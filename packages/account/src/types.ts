export type SignableMessage = {
  time: number
  sender: string
  GetVerificationBuffer?: () => Buffer
}

// -------- Tests utils

export type EphAccount = {
  address: string
  publicKey: string
  privateKey?: string
  mnemonic?: string
}
