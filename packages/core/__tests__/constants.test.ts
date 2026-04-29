describe('DEFAULT_API_V2 / DEFAULT_API_WS_V2', () => {
  const ORIGINAL_ENV = { ...process.env }

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    jest.resetModules()
  })

  it('falls back to api3.aleph.im when no env vars are set', async () => {
    delete process.env.ALEPH_API_SERVER
    delete process.env.ALEPH_API_WS_SERVER
    jest.resetModules()
    const mod = await import('../src/constants')
    expect(mod.DEFAULT_API_V2).toBe('https://api3.aleph.im/')
    expect(mod.DEFAULT_API_WS_V2).toBe('wss://api3.aleph.im/')
  })

  it('uses ALEPH_API_SERVER when set', async () => {
    process.env.ALEPH_API_SERVER = 'http://localhost:4024'
    jest.resetModules()
    const mod = await import('../src/constants')
    expect(mod.DEFAULT_API_V2).toBe('http://localhost:4024')
  })

  it('uses ALEPH_API_WS_SERVER when set', async () => {
    process.env.ALEPH_API_WS_SERVER = 'ws://localhost:4024'
    jest.resetModules()
    const mod = await import('../src/constants')
    expect(mod.DEFAULT_API_WS_V2).toBe('ws://localhost:4024')
  })
})
