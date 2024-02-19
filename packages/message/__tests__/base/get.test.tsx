import { BaseMessageClient, MessageType, PublishedMessage } from '../../'
import { Blockchain } from '../../../core/'

describe('Test features from GetMessage', () => {
  const client = new BaseMessageClient()

  it('Try by Hash with type-guard resolve', async () => {
    const res = await client.get({
      hash: '87e1e2ee2cbe88fa2923042b84b2f9c69410005ca7dd40193838bf9bad18e12c',
    })
    console.log(res)
    expect(res.isOfType(MessageType.store)).toStrictEqual(true)
    if (res.isOfType(MessageType.store))
      expect(res.content.item_hash).toStrictEqual('QmZyVbZm6Ffs9syXs8pycGbWiTa9yiGoX1b9FSFpTjaixK')
  })

  it('Try by Hash with templating resolve', async () => {
    const res = await client.get<MessageType.store>({
      hash: '87e1e2ee2cbe88fa2923042b84b2f9c69410005ca7dd40193838bf9bad18e12c',
    })

    expect(res.content.item_hash).toStrictEqual('QmZyVbZm6Ffs9syXs8pycGbWiTa9yiGoX1b9FSFpTjaixK')
  })

  it("If the message can't be resolve, it should failed", async () => {
    await expect(
      client.get({
        hash: 'w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw',
      }),
    ).rejects.toThrow('No messages found for: w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw')
  })
})

describe('Test features from GetMessage', () => {
  const client = new BaseMessageClient()
  it('Try by Pagination and page', async () => {
    const res = await client.getAll({
      pagination: 5,
      page: 2,
    })
    expect(res.messages.length).toStrictEqual(5)
    expect(res.pagination_page).toStrictEqual(2)
  })

  it('Try by Hash', async () => {
    const res = await client.getAll({
      hashes: ['87e1e2ee2cbe88fa2923042b84b2f9c69410005ca7dd40193838bf9bad18e12c'],
    })

    expect(res.messages[0].isOfType(MessageType.store)).toStrictEqual(true)
    if (res.messages[0].isOfType(MessageType.store))
      expect(res.messages[0].content.item_hash).toStrictEqual('QmZyVbZm6Ffs9syXs8pycGbWiTa9yiGoX1b9FSFpTjaixK')
  })

  it('Try by Address', async () => {
    const res = await client.getAll({
      addresses: ['0xEF4CdEB7e829053C3a33d5cF3Aaf01599654A11A'],
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.sender).toStrictEqual('0xEF4CdEB7e829053C3a33d5cF3Aaf01599654A11A')
    })
  })

  it('Try by channels', async () => {
    const aimedChannel = 'TEST'
    const res = await client.getAll({
      channels: [aimedChannel],
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.channel).toStrictEqual(aimedChannel)
    })
  })

  //This call is really long to resolve (~30s)
  it('Try by chains', async () => {
    const res = await client.getAll({
      chains: [Blockchain.ETH],
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.chain).toStrictEqual(Blockchain.ETH)
    })
  })

  it('Try by refs', async () => {
    let finded = false
    const res = await client.getAll({
      refs: ['02f6fe9398f7f931a3d5ed36c887783cf65878bb0e23aa74c1adac5ddf5fd293'],
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      if (message.item_hash === '5328b612f784f67cbb02ba603f7b057e81e91177a0baebc51f3b83a4a0dd5348') finded = true
    })
    expect(finded).toStrictEqual(true)
  })

  it('Try by content type', async () => {
    const aimedType = 'testing_oversize'
    const res = await client.getAll({
      contentTypes: [aimedType],
      pagination: 10,
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.isOfType(MessageType.post)).toStrictEqual(true)
      if (message.isOfType(MessageType.post)) expect(message.content.type).toStrictEqual(aimedType)
    })
  })

  it('Try by tags', async () => {
    const aimedTag = ['Test']
    const res = await client.getAll({
      tags: aimedTag,
      pagination: 10,
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.isOfType(MessageType.post)).toStrictEqual(true)
      if (message.isOfType(MessageType.post) && message.content.content.tags)
        expect(message.content.content.tags).toStrictEqual(aimedTag)
    })
  })

  it('Try by content Key', async () => {
    const aimedKey = 'InterPlanetaryCloud'
    const res = await client.getAll({
      contentKeys: [aimedKey],
      pagination: 10,
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.isOfType(MessageType.aggregate)).toStrictEqual(true)
      if (message.isOfType(MessageType.aggregate)) expect(message.content.key).toStrictEqual(aimedKey)
    })
  })

  it('Try by timestamp', async () => {
    const aimedStartTime = new Date(1673882430814)
    const aimedEndTime = new Date(1673882506494)
    const res = await client.getAll({
      startDate: aimedStartTime,
      endDate: aimedEndTime,
      pagination: 5,
    })

    res.messages.map((item) => {
      const date = new Date(item.time * 1000)
      expect(date.valueOf()).toBeGreaterThanOrEqual(aimedStartTime.valueOf())
      expect(date.valueOf()).toBeLessThanOrEqual(aimedEndTime.valueOf())
    })
  })

  it('If a specific message does not exist, it should return an empty array', async () => {
    const msg = await client.getAll({
      hashes: ['w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw'],
    })

    expect(msg.messages.length).toStrictEqual(0)
  })

  it('try by all message type', async () => {
    const typeArray = [
      MessageType.store,
      MessageType.post,
      MessageType.forget,
      MessageType.aggregate,
      MessageType.program,
    ]

    const checkTypeList = (messagesList: PublishedMessage<any>[], type: MessageType): boolean =>
      messagesList.every((message) => message.isOfType(type))

    await Promise.all(
      typeArray.map(async (type) => {
        const res = await client.getAll({
          messageTypes: [type],
          pagination: 3,
        })
        expect(checkTypeList(res.messages, type)).toStrictEqual(true)
      }),
    )
  })
})
