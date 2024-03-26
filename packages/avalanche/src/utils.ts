import { KeyChain, KeyPair } from 'avalanche/dist/apis/avm'
import { AvalancheCore as Avalanche, BinTools, BN, Buffer as AvaBuff } from 'avalanche'
import { KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm'
import { privateToAddress } from 'ethereumjs-util'
import shajs from 'sha.js'
import { BadSignatureError } from '@aleph-sdk/message'
import { ec as EC } from 'elliptic'

export enum ChainType {
  C_CHAIN = 'C',
  X_CHAIN = 'X',
}

/**
 * Get Key Chains
 * @param chain Avalanche chain type: c-chain | x-chain
 * @returns key chains
 */
async function getKeyChain(chain = ChainType.X_CHAIN) {
  return new KeyChain(new Avalanche().getHRP(), chain)
}

export async function getKeyPair(privateKey?: string, chain = ChainType.X_CHAIN): Promise<KeyPair> {
  const keyChain = await getKeyChain(chain)
  const keyPair = keyChain.makeKey()

  if (privateKey) {
    let keyBuff: AvaBuff
    if (privateKey.startsWith('PrivateKey-')) {
      const bintools = BinTools.getInstance()
      keyBuff = bintools.cb58Decode(privateKey.split('-')[1])
    } else {
      keyBuff = AvaBuff.from(privateKey, 'hex')
    }
    if (keyPair.importKey(keyBuff)) return keyPair
    throw new Error('Invalid private key')
  }
  return keyPair
}

/**
 * Retrieves the EVM compatible address for the current account.
 * This function works specifically with the C-Chain.
 *
 * If the current signer is not associated with the C-Chain,
 * the function throws an error.
 *
 * @returns A Promise that resolves to the EVM-style address of the account
 * @throws An error if the current signer is not associated with the C-Chain
 */
export function getEVMAddress(keypair: EVMKeyPair): string {
  const pkHex = keypair.getPrivateKey().toString('hex')
  const pkBuffNative = Buffer.from(pkHex, 'hex')
  const ethAddress = privateToAddress(pkBuffNative).toString('hex')
  return `0x${ethAddress}`
}

export function digestMessage(message: Buffer): Buffer {
  const msgSize = Buffer.alloc(4)
  msgSize.writeUInt32BE(message.length, 0)
  const msgStr = message.toString('utf-8')
  const msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, 'utf8')
  return new shajs.sha256().update(msgBuf).digest()
}

export function getAddressFromPkey(pkey: string): AvaBuff {
  if (pkey.split('-').length > 1) {
    console.log('bech32', pkey)
    const bintools = BinTools.getInstance()
    return bintools.stringToAddress(pkey)
  }
  console.log('hex', pkey)
  if (pkey.startsWith(`0x`)) pkey = pkey.substring(2)
  const shaHash = new shajs.sha256().update(pkey).digest()
  return AvaBuff.from(shaHash) // @todo lets go
}

export function splitSig(signature: string) {
  try {
    const bintools = BinTools.getInstance()
    const decodedSig = bintools.cb58Decode(signature)
    const r: BN = new BN(bintools.copyFrom(decodedSig, 0, 32))
    const s: BN = new BN(bintools.copyFrom(decodedSig, 32, 64))
    const v: number = bintools.copyFrom(decodedSig, 64, 65).readUIntBE(0, 1)
    const sigParam: any = {
      r: r,
      s: s,
      v: v,
    }
    const rhex: string = '0x' + r.toString('hex') //converts r to hex
    const shex: string = '0x' + s.toString('hex') //converts s to hex
    const sigHex: Array<string> = [rhex, shex]
    return { sigParam, sigHex }
  } catch {
    throw new BadSignatureError(`Could not split signature ${signature}`)
  }
}

export function recover(msgHash: Buffer, sig: any) {
  const ec: EC = new EC('secp256k1')
  const pubk: any = ec.recoverPubKey(msgHash, sig, sig.v)
  const pubkx: string = '0x' + pubk.x.toString('hex')
  const pubky: string = '0x' + pubk.y.toString('hex')
  const pubkCord: Array<string> = [pubkx, pubky]
  const pubkBuff: Buffer = Buffer.from(pubk.encodeCompressed())
  return { pubkCord, pubkBuff }
}
