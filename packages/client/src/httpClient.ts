import {
  AggregateMessageClient,
  AlephSocket,
  BaseMessageClient,
  ForgetMessageClient,
  InstanceMessageClient,
  PostGetConfiguration,
  PostMessageClient,
  ProgramMessageClient,
  StoreMessageClient,
  GetMessagesConfiguration,
  MessageError,
  MessageType,
} from '@aleph-sdk/message'

class AlephHttpClient {
  postClient: PostMessageClient
  forgetClient: ForgetMessageClient
  aggregateClient: AggregateMessageClient
  programClient: ProgramMessageClient
  instanceClient: InstanceMessageClient
  storeClient: StoreMessageClient
  messageClient: BaseMessageClient

  constructor(apiServer?: string) {
    this.postClient = new PostMessageClient(apiServer)
    this.forgetClient = new ForgetMessageClient(apiServer)
    this.aggregateClient = new AggregateMessageClient(apiServer)
    this.programClient = new ProgramMessageClient(apiServer)
    this.instanceClient = new InstanceMessageClient(apiServer)
    this.storeClient = new StoreMessageClient(apiServer)
    this.messageClient = new BaseMessageClient(apiServer)
  }

  async fetchAggregate<T>(address: string, key: string): Promise<T> {
    const params = { address, keys: [key] }
    const aggregate = await this.aggregateClient.get<T>(params)
    return aggregate[key]
  }

  async fetchAggregates(address: string, keys?: string[]): Promise<Record<string, any>> {
    const params = { address, keys }
    const result = await this.aggregateClient.get<any>(params)
    return result.data
  }
  async getPosts<T = any>(config: PostGetConfiguration) {
    return await this.postClient.get<T>(config)
  }

  async downloadFile(file_hash: string): Promise<ArrayBuffer> {
    return await this.storeClient.download(file_hash)
  }

  async getMessages(config: GetMessagesConfiguration) {
    return await this.messageClient.getAll(config)
  }

  async get_message<T extends MessageType | 'any' = 'any', Content = any>(itemHash: string) {
    return await this.messageClient.get<T, Content>({ hash: itemHash })
  }

  async getMessageError(itemHash: string): Promise<MessageError | null> {
    return await this.messageClient.getError(itemHash)
  }

  async watchMessages(config: GetMessagesConfiguration): Promise<AlephSocket> {
    return this.messageClient.getMessagesSocket(config)
  }
}

export default AlephHttpClient
