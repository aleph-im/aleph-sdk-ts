import {
  AggregateMessageClient,
  AlephSocket,
  BalanceClient,
  BaseMessageClient,
  CursorMessagesResponse,
  CursorPostsResponse,
  FileMetadataResponse,
  ForgetMessageClient,
  GetAccountBalanceConfiguration,
  GetAccountBalanceResponse,
  GetAccountCreditHistoryResponse,
  GetBalancesConfiguration,
  GetCreditBalancesConfiguration,
  GetCreditHistoryConfiguration,
  GetMessagesConfiguration,
  GetMessagesCursorConfiguration,
  GetResourceConsumedCreditsResponse,
  InstanceMessageClient,
  MessageContent,
  MessageError,
  MessageType,
  PaginatedBalances,
  PaginatedCreditBalances,
  PostGetConfiguration,
  PostGetCursorConfiguration,
  PostMessageClient,
  PostResponse,
  ProgramMessageClient,
  PublishedMessage,
  StorageHashResponse,
  StoreMessageClient,
} from '@aleph-sdk/message'

export class AlephHttpClient {
  postClient: PostMessageClient
  forgetClient: ForgetMessageClient
  aggregateClient: AggregateMessageClient
  programClient: ProgramMessageClient
  instanceClient: InstanceMessageClient
  storeClient: StoreMessageClient
  messageClient: BaseMessageClient
  balanceClient: BalanceClient

  constructor(apiServer?: string) {
    this.postClient = new PostMessageClient(apiServer)
    this.forgetClient = new ForgetMessageClient(apiServer)
    this.aggregateClient = new AggregateMessageClient(apiServer)
    this.programClient = new ProgramMessageClient(apiServer)
    this.instanceClient = new InstanceMessageClient(apiServer)
    this.storeClient = new StoreMessageClient(apiServer)
    this.messageClient = new BaseMessageClient(apiServer)
    this.balanceClient = new BalanceClient(apiServer)
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
    return result
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
   * Fetches a stored file by its hash, returning the base64 encoded content and its storage metadata.
   *
   * @param fileHash The hash of the file to retrieve.
   */
  async getFile(fileHash: string): Promise<StorageHashResponse> {
    return await this.storeClient.getFile(fileHash)
  }

  /**
   * Fetches a file's metadata from the hash of the STORE message that references it.
   *
   * @param messageHash The hash of the STORE message.
   */
  async getFileMetadataByMessageHash(messageHash: string): Promise<FileMetadataResponse> {
    return await this.storeClient.getFileMetadataByMessageHash(messageHash)
  }

  /**
   * Fetches a file's metadata from its reference.
   *
   * @param ref The reference of the file.
   */
  async getFileMetadataByRef(ref: string): Promise<FileMetadataResponse> {
    return await this.storeClient.getFileMetadataByRef(ref)
  }

  /**
   * Fetches the raw stored metadata of a file by its hash.
   *
   * @param fileHash The hash of the file.
   */
  async getFileMetadata(fileHash: string): Promise<Record<string, any>> {
    return await this.storeClient.getFileMetadata(fileHash)
  }

  /**
   * Fetches the number of pins referencing a given file hash.
   *
   * @param hash The hash of the file.
   */
  async getFilePinsCount(hash: string): Promise<number> {
    return await this.storeClient.getFilePinsCount(hash)
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
   * Retrieves messages using cursor-based pagination. More efficient than page-based pagination for large result sets.
   *
   * @param config The configuration used to fetch messages (same filters as getMessages, minus `page`).
   */
  async getMessagesCursor(config: GetMessagesCursorConfiguration): Promise<CursorMessagesResponse> {
    return await this.messageClient.getCursor(config)
  }

  /**
   * Returns an async iterator over all messages matching the given filters.
   * Handles cursor-based pagination automatically, yielding individual messages.
   *
   * @param config The filters used to query messages (same as getMessages, minus `page`).
   */
  getMessagesIterator(
    config: Omit<GetMessagesCursorConfiguration, 'cursor'>,
  ): AsyncGenerator<PublishedMessage<MessageContent>> {
    return this.messageClient.getAsyncIterator(config)
  }

  /**
   * Retrieves posts using cursor-based pagination. More efficient than page-based pagination for large result sets.
   *
   * @param config The configuration used to fetch posts (same filters as getPosts, minus `page`).
   */
  async getPostsCursor<T = any>(config: PostGetCursorConfiguration): Promise<CursorPostsResponse<T>> {
    return await this.postClient.getCursor<T>(config)
  }

  /**
   * Returns an async iterator over all posts matching the given filters.
   * Handles cursor-based pagination automatically, yielding individual posts.
   *
   * @param config The filters used to query posts (same as getPosts, minus `page`).
   */
  getPostsIterator<T = any>(config: Omit<PostGetCursorConfiguration, 'cursor'>): AsyncGenerator<PostResponse<T>> {
    return this.postClient.getAsyncIterator<T>(config)
  }

  /**
   * Watches for new messages on the Aleph network. This method returns a socket that can be used to listen for new messages.
   * @param config The filters used to watch for new messages, similar to getMessages.
   */
  async watchMessages(config: Omit<GetMessagesConfiguration, 'page' | 'pagination'>): Promise<AlephSocket> {
    return this.messageClient.getMessagesSocket(config)
  }

  /**
   * Fetches the token balance of an address, including the locked amount and credit balance.
   *
   * @param address The address to query.
   * @param config Optional chain filter and credit-details toggle.
   */
  async getBalance(address: string, config: GetAccountBalanceConfiguration = {}): Promise<GetAccountBalanceResponse> {
    return await this.balanceClient.getBalance(address, config)
  }

  /**
   * Fetches a paginated list of token balances across chains.
   *
   * @param config Optional chain filter, minimum balance and pagination.
   */
  async getBalances(config: GetBalancesConfiguration = {}): Promise<PaginatedBalances> {
    return await this.balanceClient.getBalances(config)
  }

  /**
   * Fetches a paginated list of credit balances.
   *
   * @param config Optional minimum balance and pagination.
   */
  async getCreditBalances(config: GetCreditBalancesConfiguration = {}): Promise<PaginatedCreditBalances> {
    return await this.balanceClient.getCreditBalances(config)
  }

  /**
   * Fetches the credit history of an address.
   *
   * @param address The address to query.
   * @param config Optional filters and pagination.
   */
  async getCreditHistory(
    address: string,
    config: GetCreditHistoryConfiguration = {},
  ): Promise<GetAccountCreditHistoryResponse> {
    return await this.balanceClient.getCreditHistory(address, config)
  }

  /**
   * Fetches the amount of credits consumed by a resource, identified by its message hash.
   *
   * @param itemHash The hash of the resource's message.
   */
  async getConsumedCredits(itemHash: string): Promise<GetResourceConsumedCreditsResponse> {
    return await this.balanceClient.getConsumedCredits(itemHash)
  }
}

export default AlephHttpClient
