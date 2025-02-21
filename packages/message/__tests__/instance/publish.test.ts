import axios from 'axios'

import * as ethereum from '../../../ethereum/src'
import { InstanceMessageClient, MAXIMUM_DISK_SIZE } from '../../src'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Test the instance message', () => {
  const instance = new InstanceMessageClient()

  it('Can create an instance and retrieve the message', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })

    const res = await instance.send({
      account: account,
      channel: 'TEST',
    })

    expect(res.content.rootfs.parent.ref).toBe('f7e68c568906b4ebcd3cd3c4bfdff96c489cd2a9ef73ba2d7503f244dfd578de')
    expect(res.content.rootfs.size_mib).toBe(128 * 10)
  })

  it('Can create an instance with a rootfs volume size larger than default tier and a custom image', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })

    const res = await instance.send({
      account: account,
      channel: 'TEST',
      resources: {
        vcpus: 1,
        memory: 1024,
      },
      rootfs: {
        parent: { ref: '5330dcefe1857bcd97b7b7f24d1420a7d46232d53f27be280c8a7071d88bd84e' },
        size_mib: 1024 * 10 * 2,
      },
    })

    expect(res.content.rootfs.parent.ref).toBe('5330dcefe1857bcd97b7b7f24d1420a7d46232d53f27be280c8a7071d88bd84e')
    expect(res.content.rootfs.size_mib).toBe(1024 * 10 * 2)
  })

  it('Can not create an instance with a rootfs volume size lower than default tier', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })

    const res = await instance.send({
      account: account,
      channel: 'TEST',
      resources: {
        vcpus: 1,
        memory: 1024,
      },
      rootfs: {
        size_mib: 1024,
      },
    })

    expect(res.content.rootfs.size_mib).toBe(1024 * 10)
  })

  it('Can not create an instance with a rootfs volume size larger than the maximum allowed (200GB)', async () => {
    const { account } = ethereum.newAccount()
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} })

    const res = await instance.send({
      account: account,
      channel: 'TEST',
      resources: {
        vcpus: 1,
        memory: 1024,
      },
      rootfs: {
        size_mib: 1024 * 201,
      },
    })

    expect(res.content.rootfs.size_mib).toBe(MAXIMUM_DISK_SIZE)
  })
})
