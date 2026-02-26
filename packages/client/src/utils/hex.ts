export function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd length (${hex.length})`)
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16)
    if (Number.isNaN(byte)) {
      throw new Error(`Invalid hex character at position ${i}: ${hex.substring(i, i + 2)}`)
    }
    bytes[i / 2] = byte
  }
  return bytes
}

export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}
