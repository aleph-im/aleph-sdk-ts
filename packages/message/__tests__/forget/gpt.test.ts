// jest test for ForgetMessageClient.send method
import { ForgetMessageClient, ItemType } from '@aleph-sdk/message'
import * as publishUtils from '@aleph-sdk/message/src/utils/publish'
import * as signatureUtils from '@aleph-sdk/message/src/utils/signature'
import { Account } from '@aleph-sdk/account'
import { ForgetContent, ForgetMessage, ForgetPublishConfiguration } from '@aleph-sdk/message/src/forget/types'
import { MessageType } from '../../src'

jest.mock('@aleph-sdk/core')
jest.mock('@aleph-sdk/message/src/utils/publish')
jest.mock('@aleph-sdk/message/src/utils/signature')
const DEFAULT_API_V2 = 'https://api2.aleph.im'
describe('ForgetMessageClient', () => {
  let forgetMessageClient: ForgetMessageClient
  let mockAccount: Account
  beforeEach(() => {
    forgetMessageClient = new ForgetMessageClient()
    mockAccount = {
      address: 'mockAddress',
      GetChain: jest.fn(),
      Sign: jest.fn(),
    } as unknown as Account
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should send a forget message correctly', async () => {
    const forgetConfiguration: ForgetPublishConfiguration = {
      account: mockAccount,
      channel: 'test-channel',
      hashes: ['hash1', 'hash2'],
      reason: 'Some reason',
      APIServer: DEFAULT_API_V2,
    }
    const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1609459200000) // Mock Date to 2021-01-01
    const expectedForgetMsg: ForgetMessage = {
      chain: mockAccount.GetChain(),
      sender: mockAccount.address,
      type: MessageType.forget,
      channel: forgetConfiguration.channel,
      confirmed: false,
      signature: '',
      size: 0,
      time: 1609459200,
      item_type: ItemType.inline,
      item_hash: '',
      item_content: '',
      content: {
        address: mockAccount.address,
        time: 1609459200,
        hashes: forgetConfiguration.hashes,
      } as ForgetContent,
    }
    const putContentToStorageEngineSpy = jest.spyOn(publishUtils, 'PutContentToStorageEngine').mockResolvedValue()
    const signAndBroadcastSpy = jest.spyOn(signatureUtils, 'SignAndBroadcast').mockResolvedValue()
    const result = await forgetMessageClient.send(forgetConfiguration)
    expect(putContentToStorageEngineSpy).toHaveBeenCalledWith(expect.objectContaining({ message: expectedForgetMsg }))
    expect(signAndBroadcastSpy).toHaveBeenCalledWith(expect.objectContaining({ message: expectedForgetMsg }))
    expect(result).toMatchObject(expectedForgetMsg)
    dateNowSpy.mockRestore()
  })
})
