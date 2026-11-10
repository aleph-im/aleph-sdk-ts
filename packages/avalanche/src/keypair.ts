import { secp256k1 } from '@noble/curves/secp256k1'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { sha256 } from '@noble/hashes/sha256'
import { base58, bech32 } from '@scure/base'
import { Buffer } from 'buffer'

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export function cb58Encode(bytes: Uint8Array): string {
  const checksum = sha256(bytes).slice(-4)
  return base58.encode(Buffer.concat([Buffer.from(bytes), Buffer.from(checksum)]))
}

export function cb58Decode(value: string | Uint8Array): Buffer {
  const encoded = typeof value === 'string' ? base58.decode(value.replace(/^PrivateKey-/, '')) : value
  if (encoded.length < 4) throw new Error('Invalid cb58 value')

  const data = encoded.slice(0, -4)
  const checksum = encoded.slice(-4)
  const expected = sha256(data).slice(-4)

  if (!equalBytes(checksum, expected)) throw new Error('Invalid cb58 checksum')

  return Buffer.from(data)
}

export function recoverPublicKey(message: Uint8Array, signature: Uint8Array): Buffer {
  const recovered = secp256k1.Signature.fromCompact(signature.slice(0, 64))
    .addRecoveryBit(signature[64])
    .recoverPublicKey(message)

  return Buffer.from(recovered.toRawBytes(true))
}

export class KeyPair {
  private privateKey: Uint8Array
  private publicKey: Uint8Array
  private hrp: string
  private chainID: string

  constructor(hrp = 'avax', chainID = '') {
    this.hrp = hrp
    this.chainID = chainID
    this.privateKey = secp256k1.utils.randomPrivateKey()
    this.publicKey = secp256k1.getPublicKey(this.privateKey, true)
  }

  importKey(privk: Uint8Array): boolean {
    try {
      if (privk.length !== 32) return false

      this.privateKey = Buffer.from(privk)
      this.publicKey = secp256k1.getPublicKey(this.privateKey, true)
      return true
    } catch {
      return false
    }
  }

  getPrivateKey(): Buffer {
    return Buffer.from(this.privateKey)
  }

  getPublicKey(): Buffer {
    return Buffer.from(this.publicKey)
  }

  getAddress(): Buffer {
    return Buffer.from(ripemd160(sha256(this.publicKey)))
  }

  getAddressString(): string {
    return `${this.chainID}-${bech32.encode(this.hrp.toLowerCase(), bech32.toWords(this.getAddress()))}`
  }

  getPrivateKeyString(): string {
    return `PrivateKey-${cb58Encode(this.privateKey)}`
  }

  getPublicKeyString(): string {
    return cb58Encode(this.publicKey)
  }

  sign(message: Uint8Array): Buffer {
    const signature = secp256k1.sign(message, this.privateKey, { lowS: true })
    if (signature.recovery === undefined) throw new Error('Unable to recover signature')

    const result = Buffer.alloc(65)
    Buffer.from(signature.toCompactRawBytes()).copy(result, 0)
    result[64] = signature.recovery

    return result
  }

  verify(message: Uint8Array, signature: Uint8Array): boolean {
    return secp256k1.verify(signature.slice(0, 64), message, this.publicKey)
  }

  recover(message: Uint8Array, signature: Uint8Array): Buffer {
    return recoverPublicKey(message, signature)
  }

  getHRP(): string {
    return this.hrp
  }

  setHRP(hrp: string): void {
    this.hrp = hrp
  }

  getChainID(): string {
    return this.chainID
  }

  setChainID(chainID: string): void {
    this.chainID = chainID
  }
}

export class EVMKeyPair extends KeyPair {}

export class KeyChain {
  private keys: Record<string, KeyPair> = {}

  constructor(
    private hrp: string,
    private chainID: string,
  ) {}

  makeKey(): KeyPair {
    const keypair = new KeyPair(this.hrp, this.chainID)
    this.addKey(keypair)
    return keypair
  }

  addKey(key: KeyPair): void {
    key.setChainID(this.chainID)
    this.keys[key.getAddress().toString('hex')] = key
  }

  importKey(privk: Uint8Array | string): KeyPair {
    const keypair = new KeyPair(this.hrp, this.chainID)
    const privateKey = typeof privk === 'string' ? cb58Decode(privk) : privk

    if (!keypair.importKey(privateKey)) throw new Error('Invalid private key')

    if (!(keypair.getAddress().toString('hex') in this.keys)) this.addKey(keypair)

    return keypair
  }
}
