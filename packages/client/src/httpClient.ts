import {
  PostMessageClient,
  ForgetMessageClient,
  AggregateMessageClient,
  ProgramMessageClient,
  InstanceMessageClient,
  StoreMessageClient,
} from '@aleph-sdk/message'

/**
 * class AlephClient(ABC):
 *     @abstractmethod
 *     async def fetch_aggregate(self, address: str, key: str) -> Dict[str, Dict]:
 *         """
 *         Fetch a value from the aggregate store by owner address and item key.
 *
 *         :param address: Address of the owner of the aggregate
 *         :param key: Key of the aggregate
 *         """
 *         raise NotImplementedError("Did you mean to import `AlephHttpClient`?")
 *
 *     @abstractmethod
 *     async def fetch_aggregates(
 *         self, address: str, keys: Optional[Iterable[str]] = None
 *     ) -> Dict[str, Dict]:
 *         """
 *         Fetch key-value pairs from the aggregate store by owner address.
 *
 *         :param address: Address of the owner of the aggregate
 *         :param keys: Keys of the aggregates to fetch (Default: all items)
 *         """
 *         raise NotImplementedError("Did you mean to import `AlephHttpClient`?")
 *
 *     @abstractmethod
 *     async def get_posts(
 *         self,
 *         page_size: int = DEFAULT_PAGE_SIZE,
 *         page: int = 1,
 *         post_filter: Optional[PostFilter] = None,
 *         ignore_invalid_messages: Optional[bool] = True,
 *         invalid_messages_log_level: Optional[int] = logging.NOTSET,
 *     ) -> PostsResponse:
 *         """
 *         Fetch a list of posts from the network.
 *
 *         :param page_size: Number of items to fetch (Default: 200)
 *         :param page: Page to fetch, begins at 1 (Default: 1)
 *         :param post_filter: Filter to apply to the posts (Default: None)
 *         :param ignore_invalid_messages: Ignore invalid messages (Default: True)
 *         :param invalid_messages_log_level: Log level to use for invalid messages (Default: logging.NOTSET)
 *         """
 *         raise NotImplementedError("Did you mean to import `AlephHttpClient`?")
 *
 *     async def get_posts_iterator(
 *         self,
 *         post_filter: Optional[PostFilter] = None,
 *     ) -> AsyncIterable[PostMessage]:
 *         """
 *         Fetch all filtered posts, returning an async iterator and fetching them page by page. Might return duplicates
 *         but will always return all posts.
 *
 *         :param post_filter: Filter to apply to the posts (Default: None)
 *         """
 *         page = 1
 *         resp = None
 *         while resp is None or len(resp.posts) > 0:
 *             resp = await self.get_posts(
 *                 page=page,
 *                 post_filter=post_filter,
 *             )
 *             page += 1
 *             for post in resp.posts:
 *                 yield post
 *
 *     @abstractmethod
 *     async def download_file(
 *         self,
 *         file_hash: str,
 *     ) -> bytes:
 *         """
 *         Get a file from the storage engine as raw bytes.
 *
 *         Warning: Downloading large files can be slow and memory intensive.
 *
 *         :param file_hash: The hash of the file to retrieve.
 *         """
 *         raise NotImplementedError("Did you mean to import `AlephHttpClient`?")
 *
 *     async def download_file_ipfs(
 *         self,
 *         file_hash: str,
 *     ) -> bytes:
 *         """
 *         Get a file from the ipfs storage engine as raw bytes.
 *
 *         Warning: Downloading large files can be slow.
 *
 *         :param file_hash: The hash of the file to retrieve.
 *         """
 *         raise NotImplementedError()
 *
 *     async def download_file_ipfs_to_buffer(
 *         self,
 *         file_hash: str,
 *         output_buffer: Writable[bytes],
 *     ) -> None:
 *         """
 *         Download a file from the storage engine and write it to the specified output buffer.
 *
 *         :param file_hash: The hash of the file to retrieve.
 *         :param output_buffer: The binary output buffer to write the file data to.
 *         """
 *         raise NotImplementedError()
 *
 *     async def download_file_to_buffer(
 *         self,
 *         file_hash: str,
 *         output_buffer: Writable[bytes],
 *     ) -> None:
 *         """
 *         Download a file from the storage engine and write it to the specified output buffer.
 *         :param file_hash: The hash of the file to retrieve.
 *         :param output_buffer: Writable binary buffer. The file will be written to this buffer.
 *         """
 *         raise NotImplementedError()
 *
 *     @abstractmethod
 *     async def get_messages(
 *         self,
 *         page_size: int = DEFAULT_PAGE_SIZE,
 *         page: int = 1,
 *         message_filter: Optional[MessageFilter] = None,
 *         ignore_invalid_messages: Optional[bool] = True,
 *         invalid_messages_log_level: Optional[int] = logging.NOTSET,
 *     ) -> MessagesResponse:
 *         """
 *         Fetch a list of messages from the network.
 *
 *         :param page_size: Number of items to fetch (Default: 200)
 *         :param page: Page to fetch, begins at 1 (Default: 1)
 *         :param message_filter: Filter to apply to the messages
 *         :param ignore_invalid_messages: Ignore invalid messages (Default: True)
 *         :param invalid_messages_log_level: Log level to use for invalid messages (Default: logging.NOTSET)
 *         """
 *         raise NotImplementedError("Did you mean to import `AlephHttpClient`?")
 *
 *     async def get_messages_iterator(
 *         self,
 *         message_filter: Optional[MessageFilter] = None,
 *     ) -> AsyncIterable[AlephMessage]:
 *         """
 *         Fetch all filtered messages, returning an async iterator and fetching them page by page. Might return duplicates
 *         but will always return all messages.
 *
 *         :param message_filter: Filter to apply to the messages
 *         """
 *         page = 1
 *         resp = None
 *         while resp is None or len(resp.messages) > 0:
 *             resp = await self.get_messages(
 *                 page=page,
 *                 message_filter=message_filter,
 *             )
 *             page += 1
 *             for message in resp.messages:
 *                 yield message
 *
 *     @abstractmethod
 *     async def get_message(
 *         self,
 *         item_hash: str,
 *         message_type: Optional[Type[GenericMessage]] = None,
 *     ) -> GenericMessage:
 *         """
 *         Get a single message from its `item_hash` and perform some basic validation.
 *
 *         :param item_hash: Hash of the message to fetch
 *         :param message_type: Type of message to fetch
 *         """
 *         raise NotImplementedError("Did you mean to import `AlephHttpClient`?")
 *
 *     @abstractmethod
 *     def watch_messages(
 *         self,
 *         message_filter: Optional[MessageFilter] = None,
 *     ) -> AsyncIterable[AlephMessage]:
 *         """
 *         Iterate over current and future matching messages asynchronously.
 *
 *         :param message_filter: Filter to apply to the messages
 *         """
 *         raise NotImplementedError("Did you mean to import `AlephHttpClient`?")
 */
class AlephHttpClient {
  postMessage: PostMessageClient
  forgetMessage: ForgetMessageClient
  aggregateMessage: AggregateMessageClient
  programMessage: ProgramMessageClient
  instanceMessage: InstanceMessageClient
  storeMessage: StoreMessageClient

  constructor(apiServer?: string) {
    this.postMessage = new PostMessageClient(apiServer)
    this.forgetMessage = new ForgetMessageClient(apiServer)
    this.aggregateMessage = new AggregateMessageClient(apiServer)
    this.programMessage = new ProgramMessageClient(apiServer)
    this.instanceMessage = new InstanceMessageClient(apiServer)
    this.storeMessage = new StoreMessageClient(apiServer)
  }

  fetchAggregate(address: string, key: string): Promise<Record<string, Record<string, unknown>>> {
    return this.aggregateMessage.get({
      address,
      keys: [key],
    })
  }

  fetchAggregates(address: string, keys?: string[]): Promise<Record<string, Record<string, unknown>>> {
    return this.aggregateMessage.get({
      address,
      keys,
    })
  }

  getPosts(pageSize: number, page: number): Promise<Record<string, unknown>> {
    return this.postMessage.get({
      page,
      pageSize,
    })
  }
}

export default AlephHttpClient
