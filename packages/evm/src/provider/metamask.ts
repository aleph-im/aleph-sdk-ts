import { encrypt } from '@metamask/eth-sig-util'
import { bufferToHex } from 'ethereumjs-util'

export enum ProviderEncryptionLabel {
  METAMASK = 'metamask',
}

const metamaskEncryption = (content: Buffer, publicKey: string): string => {
  return bufferToHex(
    Buffer.from(
      JSON.stringify(
        encrypt({
          publicKey: publicKey,
          data: content.toString(),
          version: 'x25519-xsalsa20-poly1305',
        }),
      ),
      'utf-8',
    ),
  )
}

export const ProviderEncryptionLib: {
  [key in ProviderEncryptionLabel]: (content: Buffer, publicKey: string) => Buffer | string
} = {
  [ProviderEncryptionLabel.METAMASK]: metamaskEncryption,
}
