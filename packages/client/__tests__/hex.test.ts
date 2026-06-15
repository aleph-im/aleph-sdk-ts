import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8 } from '../src/utils/hex'

describe('bytesToHex', () => {
  it('should convert bytes to hex string', () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef])
    expect(bytesToHex(bytes)).toBe('deadbeef')
  })

  it('should pad single-digit hex values with leading zero', () => {
    const bytes = new Uint8Array([0x01, 0x02, 0x0a])
    expect(bytesToHex(bytes)).toBe('01020a')
  })

  it('should return empty string for empty input', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('')
  })
})

describe('hexToBytes', () => {
  it('should convert hex string to bytes', () => {
    const bytes = hexToBytes('deadbeef')
    expect(bytes).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
  })

  it('should return empty array for empty string', () => {
    expect(hexToBytes('')).toEqual(new Uint8Array([]))
  })

  it('should throw on odd-length hex string', () => {
    expect(() => hexToBytes('abc')).toThrow('odd length')
  })

  it('should throw on invalid hex characters', () => {
    expect(() => hexToBytes('zzzz')).toThrow('Invalid hex character')
  })
})

describe('hex round-trip', () => {
  it('should round-trip bytes through hex and back', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255])
    expect(hexToBytes(bytesToHex(original))).toEqual(original)
  })

  it('should round-trip hex through bytes and back', () => {
    const original = 'ff00ab12'
    expect(bytesToHex(hexToBytes(original))).toBe(original)
  })
})

describe('utf8ToBytes', () => {
  it('should encode ASCII string', () => {
    const bytes = utf8ToBytes('hello')
    expect(bytes).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]))
  })

  it('should encode multi-byte UTF-8 characters', () => {
    const bytes = utf8ToBytes('\u00e9')
    expect(bytes).toEqual(new Uint8Array([0xc3, 0xa9]))
  })

  it('should return empty array for empty string', () => {
    expect(utf8ToBytes('')).toEqual(new Uint8Array([]))
  })
})

describe('bytesToUtf8', () => {
  it('should decode ASCII bytes', () => {
    const bytes = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])
    expect(bytesToUtf8(bytes)).toBe('hello')
  })

  it('should round-trip with utf8ToBytes', () => {
    const original = 'Hello, world! \u00e9\u00e8\u00ea'
    expect(bytesToUtf8(utf8ToBytes(original))).toBe(original)
  })
})
