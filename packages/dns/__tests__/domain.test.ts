import { DomainValidator, hostnameFromUrl, TargetType } from '../src/index'

describe('DomainValidator Tests', () => {
  test('hostnameFromUrl', () => {
    let hostname = hostnameFromUrl('https://aleph.im')
    expect(hostname).toBe('aleph.im')
    hostname = hostnameFromUrl('aleph.im')
    expect(hostname).toBe('aleph.im')
  })

  test('query A record', async () => {
    const alephdns = new DomainValidator()
    const hostname = hostnameFromUrl('https://aleph.im')
    const query = await alephdns.getIPv4Addresses(hostname) // Adjust method based on actual implementation
    expect(query).not.toBeNull()
    expect(query.length).toBeGreaterThan(0)
  })

  test('get IPv6 address', async () => {
    const alephdns = new DomainValidator()
    const url = 'https://aleph.im'
    const hostname = hostnameFromUrl(url)
    const ipv6Addresses = await alephdns.getIPv6Addresses(hostname)
    expect(ipv6Addresses).not.toBeNull()
    expect(ipv6Addresses.length).toBeGreaterThan(0)
    expect(ipv6Addresses[0]).toContain(':')
  })

  test('DNSLink', async () => {
    const alephdns = new DomainValidator()
    const url = 'https://aleph.im'
    const hostname = hostnameFromUrl(url)
    const dnslink = await alephdns.getDnsLink(hostname)
    expect(dnslink).not.toBeNull()
  })

  test('configured domain', async () => {
    const alephdns = new DomainValidator()
    const url = 'https://custom-domain-unit-test.aleph.sh'
    const hostname = hostnameFromUrl(url)
    const status = await alephdns.checkDomain(hostname, TargetType.IPFS, '0xfakeaddress')
    expect(typeof status).toBe('object')
  })

  test('not configured domain', async () => {
    const alephdns = new DomainValidator()
    const url = 'https://not-configured-domain.aleph.sh'
    const hostname = hostnameFromUrl(url)
    await expect(alephdns.checkDomain(hostname, TargetType.IPFS, '0xfakeaddress')).rejects.toThrow()
  })
})
