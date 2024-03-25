import { Resolver, resolveNs } from 'dns'
import { URL } from 'url'
import { DomainConfigurationError } from './errors'
import { DNS_RESOLVERS, DNS_STATIC_DOMAIN, DNS_PROGRAM_DOMAIN, DNS_INSTANCE_DOMAIN, DNS_IPFS_DOMAIN } from './constants'
import { TargetType } from './types'

type Hostname = string

class DNSRule {
  constructor(
    public name: string,
    public dns: Record<string, any>,
    public info: string,
    public on_error: string,
  ) {}

  raiseError(status: Record<string, boolean>): void {
    throw new DomainConfigurationError(`${this.info}, ${this.on_error}, ${JSON.stringify(status)}`)
  }
}

export function hostnameFromUrl(url: string): Hostname {
  if (!url.includes('://')) {
    url = `https://${url}`
  }
  const parsed = new URL(url)
  if (parsed.hostname) {
    return parsed.hostname
  }
  throw new Error('Invalid URL')
}

export class DomainValidator {
  private resolver: Resolver = new Resolver()

  constructor(dnsServers = DNS_RESOLVERS) {
    this.resolver.setServers(dnsServers)
  }

  // This function can be problematic due to TypeScript's type system; might need adjustments
  async getIPv4Addresses(hostname: Hostname): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.resolver.resolve4(hostname, (err, addresses) => {
        if (err) reject(err)
        else resolve(addresses)
      })
    })
  }

  // Similar to getIPv4Addresses, adjust for IPv6
  async getIPv6Addresses(hostname: Hostname): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.resolver.resolve6(hostname, (err, addresses) => {
        if (err) reject(err)
        else resolve(addresses)
      })
    })
  }

  async getDnsLinks(hostname: Hostname): Promise<string[]> {
    const txtRecords = await new Promise<string[][]>((resolve, reject) => {
      this.resolver.resolveTxt(`_dnslink.${hostname}`, (err, records) => {
        if (err) reject(err)
        else resolve(records)
      })
    })

    return txtRecords.flat().filter((record) => record.startsWith('dnslink='))
  }

  async getDnsLink(hostname: Hostname): Promise<string | null> {
    const dnsLinks = await this.getDnsLinks(hostname)
    return dnsLinks.length > 0 ? dnsLinks[0] : null
  }

  async getTxtValues(hostname: Hostname, delimiter?: string): Promise<string[]> {
    const txtRecords = await new Promise<string[][]>((resolve, reject) => {
      this.resolver.resolveTxt(hostname, (err, records) => {
        if (err) reject(err)
        else resolve(records)
      })
    })

    let values: string[] = txtRecords.flat()
    if (delimiter) {
      values = values.flatMap((record) => record.split(delimiter))
    }

    return values.filter((value) => value.startsWith('0x')) // Adjust filter condition as needed
  }

  async getNameServers(hostname: Hostname): Promise<string[]> {
    let dnsServers = DNS_RESOLVERS
    let fqdn = hostname

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const entries = await new Promise<string[]>((resolve, reject) => {
          resolveNs(fqdn, (err, addresses) => {
            if (err) reject(err)
            else resolve(addresses)
          })
        })
        let servers: string[] = []
        for (const entry of entries) {
          servers = servers.concat(await this.getIPv6Addresses(entry))
          servers = servers.concat(await this.getIPv4Addresses(entry))
        }

        dnsServers = servers
        break
      } catch (err) {
        const subDomains = fqdn.split('.')
        if (subDomains.length > 2) {
          fqdn = subDomains.slice(1).join('.')
          continue
        }

        if (subDomains.length === 2) {
          break
        }

        console.debug(`Unexpected error: ${err}, ${typeof err}`)
        break
      }
    }

    return dnsServers
  }

  async getResolverFor(hostname: Hostname): Promise<Resolver> {
    const dnsServers = await this.getNameServers(hostname)
    const resolver = new Resolver()
    resolver.setServers(dnsServers)
    return resolver
  }

  getRequiredDnsRules(hostname: Hostname, target: TargetType, owner?: string): DNSRule[] {
    let cnameValue: string | null = null
    if (target === TargetType.IPFS) {
      cnameValue = DNS_IPFS_DOMAIN
    } else if (target === TargetType.PROGRAM) {
      cnameValue = `${hostname}.${DNS_PROGRAM_DOMAIN}`
    } else if (target === TargetType.INSTANCE) {
      cnameValue = `${hostname}.${DNS_INSTANCE_DOMAIN}`
    }

    const dnsRules: DNSRule[] = []

    if (cnameValue) {
      dnsRules.push(
        new DNSRule(
          'cname',
          {
            type: 'cname',
            name: hostname,
            value: cnameValue,
          },
          `Create a CNAME record for ${hostname} with value ${cnameValue}`,
          `CNAME record not found: ${hostname}`,
        ),
      )
    }

    if (target === TargetType.IPFS) {
      dnsRules.push(
        new DNSRule(
          'delegation',
          {
            type: 'cname',
            name: `_dnslink.${hostname}`,
            value: `_dnslink.${hostname}.${DNS_STATIC_DOMAIN}`,
          },
          `Create a CNAME record for _dnslink.${hostname} with value _dnslink.${hostname}.${DNS_STATIC_DOMAIN}`,
          `CNAME record not found: _dnslink.${hostname}`,
        ),
      )
    }

    if (owner) {
      dnsRules.push(
        new DNSRule(
          'owner_proof',
          {
            type: 'txt',
            name: `_control.${hostname}`,
            value: owner,
          },
          `Create a TXT record for _control.${hostname} with value ${owner}`,
          'Owner address mismatch',
        ),
      )
    }

    return dnsRules
  }

  async checkDomain(hostname: Hostname, target: TargetType, owner?: string): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}

    const dnsRules = this.getRequiredDnsRules(hostname, target, owner)
    const resolver = await this.getResolverFor(hostname) // Ensure this method is correctly implemented to get a DNS resolver
    for (const dnsRule of dnsRules) {
      status[dnsRule.name] = false

      const recordName = dnsRule.dns['name']
      const recordType = dnsRule.dns['type']
      const recordValue = dnsRule.dns['value']

      try {
        let entries: string[]
        switch (recordType) {
          case 'txt':
            entries = await new Promise<string[]>((resolve, reject) => {
              resolver.resolveTxt(recordName, (err, records) => {
                if (err) reject(err)
                else resolve(records.flat())
              })
            })
            break
          case 'cname':
            entries = await new Promise<string[]>((resolve, reject) => {
              resolver.resolveCname(recordName, (err, records) => {
                if (err) reject(err)
                else resolve(records)
              })
            })
            break
          // Add cases for other record types as needed
          default:
            entries = []
            break
        }

        for (const entry of entries) {
          const entryValue = Array.isArray(entry) ? entry.join('') : entry // TXT records are arrays
          if (entryValue === recordValue) {
            status[dnsRule.name] = true
            break
          }
        }
      } catch (error) {
        console.error(`Failed to query DNS for ${recordName}: ${error}`)
        // Continue checks despite errors
      }
    }

    const allTrue = Object.values(status).every((value) => value)
    if (!allTrue) {
      throw new DomainConfigurationError(`Domain configuration error for ${hostname}`)
    }

    return status
  }
}
