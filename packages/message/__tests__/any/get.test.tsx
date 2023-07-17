import { any } from '../../index'
import { BaseMessage, Chain, MessageType, StoreMessage } from '../../../src/messages/types'

describe('Test features from GetMessage', () => {
  it('Try by Hash with type-guard resolve', async () => {
    const res = await any.GetMessage({
      hash: '87e1e2ee2cbe88fa2923042b84b2f9c69410005ca7dd40193838bf9bad18e12c',
    })

    expect(any.is.Store(res)).toStrictEqual(true)
    if (any.is.Store(res)) expect(res.content.item_hash).toStrictEqual('QmZyVbZm6Ffs9syXs8pycGbWiTa9yiGoX1b9FSFpTjaixK')
  })

  it('Try by Hash with templating resolve', async () => {
    const res = await any.GetMessage<StoreMessage>({
      hash: '87e1e2ee2cbe88fa2923042b84b2f9c69410005ca7dd40193838bf9bad18e12c',
    })

    expect(res.content.item_hash).toStrictEqual('QmZyVbZm6Ffs9syXs8pycGbWiTa9yiGoX1b9FSFpTjaixK')
  })

  it("If the message can't be resolve, it should failed", async () => {
    await expect(
      any.GetMessage({
        hash: 'w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw',
      }),
    ).rejects.toThrow('No messages found for: w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw')
  })
})

describe('Test features from GetMessage', () => {
  it('Try by Pagination and page', async () => {
    const res = await any.GetMessages({
      pagination: 5,
      page: 2,
    })
    expect(res.messages.length).toStrictEqual(5)
    expect(res.pagination_page).toStrictEqual(2)
  })

  it('Try by Hash', async () => {
    const res = await any.GetMessages({
      hashes: ['87e1e2ee2cbe88fa2923042b84b2f9c69410005ca7dd40193838bf9bad18e12c'],
    })

    expect(any.is.Store(res.messages[0])).toStrictEqual(true)
    if (any.is.Store(res.messages[0]))
      expect(res.messages[0].content.item_hash).toStrictEqual('QmZyVbZm6Ffs9syXs8pycGbWiTa9yiGoX1b9FSFpTjaixK')
  })

  it('Try by Address', async () => {
    const res = await any.GetMessages({
      addresses: ['0xEF4CdEB7e829053C3a33d5cF3Aaf01599654A11A'],
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.sender).toStrictEqual('0xEF4CdEB7e829053C3a33d5cF3Aaf01599654A11A')
    })
  })

  it('Try by channels', async () => {
    const aimedChannel = 'TEST'
    const res = await any.GetMessages({
      channels: [aimedChannel],
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.channel).toStrictEqual(aimedChannel)
    })
  })

  //This call is really long to resolve (~30s)
  it('Try by chains', async () => {
    const res = await any.GetMessages({
      chains: [Chain.ETH],
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(message.chain).toStrictEqual(Chain.ETH)
    })
  })

  it('Try by refs', async () => {
    let finded = false
    const res = await any.GetMessages({
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
    const res = await any.GetMessages({
      contentTypes: [aimedType],
      pagination: 10,
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(any.is.Post(message)).toStrictEqual(true)
      if (any.is.Post(message)) expect(message.content.type).toStrictEqual(aimedType)
    })
  })

  it('Try by tags', async () => {
    const aimedTag = ['Test']
    const res = await any.GetMessages({
      tags: aimedTag,
      pagination: 10,
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(any.is.Post(message)).toStrictEqual(true)
      if (any.is.Post<{ tags: string }>(message)) expect(message.content.content?.tags).toStrictEqual(aimedTag)
    })
  })

  it('Try by content Key', async () => {
    const aimedKey = 'InterPlanetaryCloud'
    const res = await any.GetMessages({
      contentKeys: [aimedKey],
      pagination: 10,
    })

    expect(res.messages.length).toBeGreaterThan(0)
    res.messages.map((message) => {
      expect(any.is.Aggregate(message)).toStrictEqual(true)
      if (any.is.Aggregate(message)) expect(message.content.key).toStrictEqual(aimedKey)
    })
  })

  it('Try by timestamp', async () => {
    const aimedStartTime = new Date(1673882430814)
    const aimedEndTime = new Date(1673882506494)
    const res = await any.GetMessages({
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
    const msg = await any.GetMessages({
      hashes: ['w87e1e2ee2cbe88fa2923042b84b2f9c694w10005ca7dd40193838bf9bad18e12cw'],
    })

    expect(msg.messages.length).toStrictEqual(0)
  })

  it('try by all message type', async () => {
    const typeArray = [
      { type: MessageType.store, checker: any.is.Store },
      { type: MessageType.post, checker: any.is.Post },
      { type: MessageType.forget, checker: any.is.Forget },
      { type: MessageType.aggregate, checker: any.is.Aggregate },
      { type: MessageType.program, checker: any.is.Program },
    ]

    const checkTypeList = (messagesList: BaseMessage[], fctChecker: (message: BaseMessage) => boolean): boolean =>
      messagesList.every(fctChecker)

    await Promise.all(
      typeArray.map(async (item) => {
        const res = await any.GetMessages({
          messageType: item.type,
          pagination: 3,
        })
        expect(checkTypeList(res.messages, item.checker)).toStrictEqual(true)
      }),
    )
  })
})
