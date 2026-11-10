import { secp256k1 } from '@noble/curves/secp256k1'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { sha256 } from '@noble/hashes/sha256'
import { base58 } from '@scure/base'
import { Buffer } from 'buffer'

const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function polymodStep(pre: number): number {
  const b = pre >> 25
  return (
    ((pre & 0x1ffffff) << 5) ^
    (-((b >> 0) & 1) & 0x3b6a57b2) ^
    (-((b >> 1) & 1) & 0x26508e6d) ^
    (-((b >> 2) & 1) & 0x1ea119fa) ^
    (-((b >> 3) & 1) & 0x3d4233dd) ^
    (-((b >> 4) & 1) & 0x2a1462b3)
  )
}

function prefixChk(prefix: string): number {
  let chk = 1

  for (let i = 0; i < prefix.length; i++) {
    chk = polymodStep(chk) ^ (prefix.charCodeAt(i) >> 5)
  }
  chk = polymodStep(chk)

  for (let i = 0; i < prefix.length; i++) {
    chk = polymodStep(chk) ^ (prefix.charCodeAt(i) & 0x1f)
  }

  return chk
}

function toWords(bytes: Uint8Array): number[] {
  const result: number[] = []
  let value = 0
  let bits = 0

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      bits -= 5
      result.push((value >> bits) & 31)
    }
  }

  if (bits > 0) result.push((value << (5 - bits)) & 31)

  return result
}

function bech32Encode(prefix: string, words: number[], limit = 90): string {
  const lowered = prefix.toLowerCase()
  if (lowered.length + 7 + words.length > limit) throw new Error('Exceeds length limit')

  let chk = prefixChk(lowered)
  let result = `${lowered}1`

  for (const word of words) {
    if (word >> 5 !== 0) throw new Error('Non 5-bit word')
    chk = polymodStep(chk) ^ word
    result += BECH32_ALPHABET.charAt(word)
  }

  for (let i = 0; i < 6; i++) chk = polymodStep(chk)
  chk ^= 1

  for (let i = 0; i < 6; i++) {
    result += BECH32_ALPHABET.charAt((chk >> ((5 - i) * 5)) & 31)
  }

  return result
}

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

  constructor(hrp = '', chainID = '') {
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
    return `${this.chainID}-${bech32Encode(this.hrp, toWords(this.getAddress()))}`
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
