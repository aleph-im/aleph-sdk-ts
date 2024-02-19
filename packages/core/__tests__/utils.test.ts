import { stripTrailingSlash, getSocketPath, isNode } from '../'

describe('stripTrailingSlash', () => {
  it('should remove trailing slashes and spaces from url', () => {
    const testUrl = 'https://example.com//    '
    const expectedUrl = 'https://example.com'
    expect(stripTrailingSlash(testUrl)).toEqual(expectedUrl)
  })

  it('should return the same url if no trailing slashes or spaces', () => {
    const testUrl = 'https://example.com'
    expect(stripTrailingSlash(testUrl)).toEqual(testUrl)
  })
})

describe('getSocketPath', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return the value of the ALEPH_API_UNIX_SOCKET environment variable if set', () => {
    const socketPath = '/tmp/socket'
    process.env.ALEPH_API_UNIX_SOCKET = socketPath
    expect(getSocketPath()).toEqual(socketPath)
  })

  it('should return undefined if the ALEPH_API_UNIX_SOCKET environment variable is not set', () => {
    delete process.env.ALEPH_API_UNIX_SOCKET
    expect(getSocketPath()).toBeUndefined()
  })
})

describe('isNode', () => {
  const originalProcess = global.process

  afterEach(() => {
    global.process = originalProcess
  })

  it('should return true if running in Node environment', () => {
    // Here, setting a mock value for process.version to simulate Node.js environment
    global.process = { ...global.process, version: 'v12.18.3' }
    expect(isNode()).toBeTruthy()
  })

  it('should return false if not running in Node environment', () => {
    // Creating a mock where process.version is undefined to simulate non-Node.js environments
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.process.version
    // This would be true in a browser
    const mockWindow = { window: 'window' }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.window = <Window>mockWindow
    expect(isNode()).toBeFalsy()
  })
})
