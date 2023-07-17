import { E2EWalletAdapter } from '@jet-lab/e2e-react-adapter'
import { Keypair, PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'

type WalletSignature = {
  signature: Uint8Array
  publicKey: string
}

class SolanaMockProvider {
  public provider
  public publicKey: PublicKey
  public secretKey: Uint8Array
  public connected: boolean

  constructor(randomKeypair: Keypair) {
    this.provider = new E2EWalletAdapter({ keypair: randomKeypair })
    this.secretKey = randomKeypair.secretKey
    this.publicKey = this.provider.publicKey
    this.connected = this.provider.connected
  }

  connect(): Promise<void> {
    return this.provider.connect()
  }
}

export class PanthomMockProvider extends SolanaMockProvider {
  signMessage(message: Uint8Array): Promise<WalletSignature> {
    const signature = nacl.sign.detached(message, this.secretKey)
    return Promise.resolve({ signature: signature, publicKey: this.publicKey.toString() })
  }
}

export class OfficialMockProvider extends SolanaMockProvider {
  signMessage(message: Uint8Array): Promise<Uint8Array> {
    const signature = nacl.sign.detached(message, this.secretKey)
    return Promise.resolve(signature)
  }
}
