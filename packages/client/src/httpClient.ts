import {
  AggregateMessageClient, BaseMessageClient,
  ForgetMessageClient,
  InstanceMessageClient,
  PostMessageClient,
  ProgramMessageClient,
  StoreMessageClient,
} from '@aleph-sdk/message'
import {MessageFilter, PostFilter} from "./types";
import {MessageError, MessageType} from "@aleph-sdk/message/src";

/**
 * class AlephClient(ABC):

 */
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
  async getPosts<T = any>(
    pageSize: number = 200,
    page: number = 1,
    postFilter: PostFilter = {},
  ) {
    const params = {
      ...postFilter,
      page: page,
      pageSize: pageSize,
    }
    return await this.postClient.get<T>(params)
  }

  async downloadFile(file_hash: string): Promise<ArrayBuffer> {
    return await this.storeClient.download(file_hash)
  }

  async getMessages(
    pageSize: number = 200,
    page: number = 1,
    filter: MessageFilter = {},
  ) {
    const startDate: Date | undefined = filter.startDate instanceof Number ? new Date(filter.startDate) : filter.startDate as Date
    const endDate: Date | undefined = filter.endDate instanceof Number ? new Date(filter.endDate) : filter.endDate as Date
    const params = {
      ...filter,
      page: page,
      pageSize: pageSize,
      startDate,
      endDate,
    }
    return await this.messageClient.getAll(params)
  }

  async get_message<T extends MessageType | 'any' = 'any', Content = any>(itemHash: string) {
    return await this.messageClient.get<T, Content>({ hash: itemHash })
  }

  async getMessageError(itemHash: string): Promise<MessageError | null> {
    return await this.messageClient.getError(itemHash)
  }

  /*
    async def watch_messages(
        self,
        message_filter: Optional[MessageFilter] = None,
    ) -> AsyncIterable[AlephMessage]:
        message_filter = message_filter or MessageFilter()
        params = message_filter.as_http_params()

        async with self.http_session.ws_connect(
            "/api/ws0/messages", params=params
        ) as ws:
            logger.debug("Websocket connected")
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    if msg.data == "close cmd":
                        await ws.close()
                        break
                    else:
                        data = json.loads(msg.data)
                        yield parse_message(data)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    break

   */
}

export default AlephHttpClient
