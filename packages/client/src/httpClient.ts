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

export class AlephHttpClient {
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

  /**
   * Fetches an aggregate value from the Aleph network. Aggregates are a key-value store on the Aleph network.
   * Aggregates are bound by address and each address can have multiple keys.
   * By default, only the address that signs the aggregate can modify it.
   *
   * @param address The address of the aggregate's owner
   * @param key The key of the aggregate to fetch
   */
  async fetchAggregate<T>(address: string, key: string): Promise<T> {
    const params = { address, keys: [key] }
    const aggregate = await this.aggregateClient.get<T>(params)
    return aggregate[key]
  }

  /**
   * Fetches multiple aggregates from the Aleph network. Aggregates are a key-value store on the Aleph network.
   * Aggregates are bound by address and each address can have multiple keys.
   * By default, only the address that signs the aggregate can modify it.
   *
   * @param address The address of the aggregate's owner
   * @param keys The keys of the aggregates to fetch
   */
  async fetchAggregates(address: string, keys?: string[]): Promise<Record<string, any>> {
    const params = { address, keys }
    const result = await this.aggregateClient.get<any>(params)
    return result.data
  }

  /**
   * Fetches a POST message on the Aleph network. POST messages are used to store arbitrary JSON data on the Aleph network.
   * They can be queried by type, channel, reference, address, tag, or hash.
   * POSTs can be modified by amend messages. This endpoint returns the latest version of the POST.
   *
   * @param config The configuration used to fetch a post message.
   */
  async getPost<T = any>(config: PostGetConfiguration) {
    return await this.postClient.get<T>(config)
  }

  /**
   * Fetches multiple POST messages on the Aleph network. POST messages are used to store arbitrary JSON data on the Aleph network.
   *
   * @param config The configuration used to fetch a post message.
   */
  async getPosts<T = any>(config: PostGetConfiguration) {
    return await this.postClient.getAll<T>(config)
  }

  /**
   * Downloads a file from the Aleph network.
   *
   * @param file_hash The hash of the STORE message of the file to retrieve.
   */
  async downloadFile(file_hash: string): Promise<ArrayBuffer> {
    return await this.storeClient.download(file_hash)
  }

  /**
   * Retrieves raw messages from the Aleph network. Similar to getPosts, but with more options.
   *
   * @param config The configuration used to fetch messages.
   */
  async getMessages(config: GetMessagesConfiguration) {
    return await this.messageClient.getAll(config)
  }

  /**
   * Tries to fetch a specific message from the Aleph network. Throws an error if the message is not found or forgotten.
   *
   * @param itemHash The hash of the message to fetch.
   */
  async getMessage<T extends MessageType | 'any' = 'any', Content = any>(itemHash: string) {
    return await this.messageClient.get<T, Content>({ hash: itemHash })
  }

  /**
   * Fetches the reason why a message has been rejected from the network. If the message has no error, returns null.
   *
   * @param itemHash The hash of the message to fetch the error from.
   */
  async getMessageError(itemHash: string): Promise<MessageError | null> {
    return await this.messageClient.getError(itemHash)
  }

  /**
   * Watches for new messages on the Aleph network. This method returns a socket that can be used to listen for new messages.
   * @param config The filters used to watch for new messages, similar to getMessages.
   */
  async watchMessages(config: Omit<GetMessagesConfiguration, 'page' | 'pageSize'>): Promise<AlephSocket> {
    return this.messageClient.getMessagesSocket(config)
  }
}

export default AlephHttpClient
