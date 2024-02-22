import AlephHttpClient from './httpClient'
import { Account } from '@aleph-sdk/account'
import {DEFAULT_API_V2, RequireOnlyOne} from '@aleph-sdk/core'
import {Encoding, ItemType, MachineVolume, StorePublishConfiguration} from "@aleph-sdk/message";

export class AuthenticatedAlephHttpClient extends AlephHttpClient {
  account: Account
  constructor(apiServer: string = DEFAULT_API_V2, account: Account) {
    super(apiServer)
    this.account = account
  }

  /**
   * Create a POST message on the aleph.im network. It is associated with a channel and owned by an account.
   *
   * @param postContent The content of the message
   * @param postType An arbitrary content type that helps to describe the post_content
   * @param ref A reference to a previous message that it replaces
   * @param address The address that will be displayed as the author of the message
   * @param channel The channel that the message will be posted on
   * @param inline An optional flag to indicate if the content should be inlined in the message or not
   * @param storageEngine An optional storage engine to use for the message, if not inlined (Default: "storage")
   * @param sync If true, waits for the message to be processed by the API server (Default: False)
   */
  async createPost<Content = any>(
    postContent: Content,
    postType: string,
    ref?: string,
    address?: string,
    channel?: string,
    inline: boolean = true,
    storageEngine: ItemType = ItemType.storage,
    sync: boolean = false
  ) {
    return await this.postClient.send<Content>({
      account: this.account,
      content: postContent,
      postType,
      ref,
      address,
      channel,
      storageEngine: inline ? ItemType.inline : storageEngine,
      sync
    })
  }

  /**
   * Create an AGGREGATE message. It is meant to be used as a quick access storage associated with an account.
   *
   * @param key Key to use to store the content
   * @param content Content to store
   * @param address Address to use to sign the message
   * @param channel Channel to use
   * @param inline Whether to write content inside the message (Default: True)
   * @param sync If true, waits for the message to be processed by the API server (Default: False)
   */
  async createAggregate<Content>(key: string, content: any, address?: string, channel?: string, inline: boolean = true, sync: boolean = false) {
    return await this.aggregateClient.send<Content>({
      account: this.account,
      key,
      content,
      address,
      channel,
      sync,
      storageEngine: inline ? ItemType.inline : ItemType.storage
    })
  }

  /**
   * Create a STORE message to store a file on the aleph.im network.
   * Can be passed either a file path, an IPFS hash or the file's content as raw bytes.
   *
   * @param fileContent Byte stream of the file to store
   * @param fileHash Hash of the file to store
   * @param storageEngine Storage engine to use (Default: "storage")
   * @param extraFields Extra fields to add to the STORE message @todo: Implement this
   * @param channel Channel to post the message to
   * @param sync If true, waits for the message to be processed by the API server (Default: False)
   */
  async createStore(
    fileContent?: Buffer | Blob,
    fileHash?: string,
    storageEngine: ItemType.storage | ItemType.ipfs = ItemType.storage,
    channel?: string,
    sync: boolean = false
  ) {
    return await this.storeClient.send({
      account: this.account,
      fileObject: fileContent,
      fileHash,
      storageEngine,
      channel,
      sync
    } as RequireOnlyOne<StorePublishConfiguration, "fileObject" | "fileHash">)
  }

  /**
   * Post a (create) PROGRAM message.
   *
   * @param programRef Reference to the program to run
   * @param entrypoint Entrypoint to run, e.g. "main:app"
   * @param runtime Runtime image to use, accessed by its item hash
   * @param environmentVariables Environment variables to pass to the program
   * @param storageEngine Storage engine to use (Default: "storage")
   * @param channel Channel to use
   * @param memory Memory in MB for the VM to be allocated (Default: 128)
   * @param vcpus Number of vCPUs to allocate (Default: 1)
   * @param timeoutSeconds Timeout in seconds (Default: 30.0)
   * @param persistent Whether the program should be persistent or not
   * @param allowAmend Whether the deployed VM image may be changed (Default: False)
   * @param internet Whether the VM should have internet connectivity (Default: True)
   * @param alephApi Whether the VM needs access to Aleph messages API (Default: True)
   * @param encoding Encoding for the uploaded code to use (Default: Encoding.zip)
   * @param volumes Volumes to mount
   * @param subscriptions Patterns of aleph.im messages to forward to the program's event receiver
   * @param metadata Metadata to attach to the message
   * @param sync If true, waits for the message to be processed by the API server
   */
  async createProgram(
    programRef: string,
    entrypoint: string,
    runtime: string,
    environmentVariables?: Record<string, string>,
    storageEngine: ItemType.storage | ItemType.ipfs = ItemType.storage,
    channel?: string,
    memory?: number,
    vcpus?: number,
    timeoutSeconds?: number,
    persistent: boolean = false,
    allowAmend: boolean = false,
    internet: boolean = true,
    alephApi: boolean = true,
    encoding: Encoding = Encoding.zip,
    volumes?: MachineVolume[],
    subscriptions?: Record<string, unknown>[],
    metadata?: Record<string, unknown>,
    sync: boolean = false,
  ) {
    return await this.programClient.send({
      account: this.account,
      programRef,
      entrypoint,
      runtime,
      variables: environmentVariables,
      storageEngine,
      channel,
      sync,
      memory,
      vcpus,
      timeoutSeconds,
      isPersistent: persistent,
      allowAmend,
      internet,
      alephApi,
      encoding,
      volumes,
      subscriptions,
      metadata
    })
  }

  /**
   * Create a VM instance on the network.
   *
   *         :param rootfs: Root filesystem to use
   *         :param rootfs_size: Size of root filesystem
   *         :param rootfs_name: Name of root filesystem
   *         :param payment: Payment method used to pay for the instance
   *         :param environment_variables: Environment variables to pass to the program
   *         :param storage_engine: Storage engine to use (Default: "storage")
   *         :param channel: Channel to use (Default: "TEST")
   *         :param address: Address to use (Default: account.get_address())
   *         :param sync: If true, waits for the message to be processed by the API server
   *         :param memory: Memory in MB for the VM to be allocated (Default: 128)
   *         :param vcpus: Number of vCPUs to allocate (Default: 1)
   *         :param timeout_seconds: Timeout in seconds (Default: 30.0)
   *         :param allow_amend: Whether the deployed VM image may be changed (Default: False)
   *         :param internet: Whether the VM should have internet connectivity. (Default: True)
   *         :param aleph_api: Whether the VM needs access to Aleph messages API (Default: True)
   *         :param encoding: Encoding to use (Default: Encoding.zip)
   *         :param volumes: Volumes to mount
   *         :param volume_persistence: Where volumes are persisted, can be "host" or "store", meaning distributed across Aleph.im (Default: "host")
   *         :param ssh_keys: SSH keys to authorize access to the VM
   *         :param metadata: Metadata to attach to the message
   * @param rootfs Root filesystem to use
   * @param rootfsSize Size of root filesystem
   * @param rootfsName Name of root filesystem
   * @param payment Payment method used to pay for the instance
   * @param environmentVariables Environment variables to pass to the program
   * @param storageEngine Storage engine to use (Default: "storage")
   * @param channel Channel to use
   * @param memory
   * @param vcpus
   * @param timeoutSeconds
   * @param allowAmend
   * @param internet
   * @param alephApi
   * @param volumes
   * @param volumePersistence
   * @param sshKeys
   * @param metadata
   * @param sync If true, waits for the message to be processed by the API server
   */
  async createInstance({
    rootfs: string,
    rootfsSize: number,
    rootfsName: string,
    payment?: any,
    environmentVariables?: Record<string, string>,
    storageEngine: ItemType.storage | ItemType.ipfs = ItemType.storage,
    channel?: string,
    memory?: number,
    vcpus?: number,
    timeoutSeconds?: number,
    allowAmend: boolean = false,
    internet: boolean = true,
    alephApi: boolean = true,
    volumes?: MachineVolume[],
    volumePersistence: string = "host",
    sshKeys?: string[],
    metadata?: Record<string, any>,
    sync: boolean = false,
}) {
    return await this.instanceClient.send({
      account: this.account,
      rootfs: {
          parent: {
              hash: rootfs,
              name: rootfsName
          },
          persistence: volumePersistence,
          size_mib: rootfsSize
      },
      payment,
      environment: {
          reproducible: false,
          internet,
          aleph_api: alephApi,
      },
      variables: environmentVariables,
      resources: {
          memory,
          vcpus
      },
      runtime: 'bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4',
      volumes,
      metadata,
      storageEngine,
      channel,
      sync
    })
  }
  /*
   *     @abstractmethod
   *     async def forget(
   *         self,
   *         hashes: List[str],
   *         reason: Optional[str],
   *         storage_engine: StorageEnum = StorageEnum.storage,
   *         channel: Optional[str] = None,
   *         address: Optional[str] = None,
   *         sync: bool = False,
   *     ) -> Tuple[AlephMessage, MessageStatus]:
   *         """
   *         Post a FORGET message to remove previous messages from the network.
   *
   *         Targeted messages need to be signed by the same account that is attempting to forget them,
   *         if the creating address did not delegate the access rights to the forgetting account.
   *
   *         :param hashes: Hashes of the messages to forget
   *         :param reason: Reason for forgetting the messages
   *         :param storage_engine: Storage engine to use (Default: "storage")
   *         :param channel: Channel to use (Default: "TEST")
   *         :param address: Address to use (Default: account.get_address())
   *         :param sync: If true, waits for the message to be processed by the API server (Default: False)
   *         """
   *         raise NotImplementedError(
   *             "Did you mean to import `AuthenticatedAlephHttpClient`?"
   *         )
   *
   *     @abstractmethod
   *     async def submit(
   *         self,
   *         content: Dict[str, Any],
   *         message_type: MessageType,
   *         channel: Optional[str] = None,
   *         storage_engine: StorageEnum = StorageEnum.storage,
   *         allow_inlining: bool = True,
   *         sync: bool = False,
   *         raise_on_rejected: bool = True,
   *     ) -> Tuple[AlephMessage, MessageStatus, Optional[Dict[str, Any]]]:
   *         """
   *         Submit a message to the network. This is a generic method that can be used to submit any type of message.
   *         Prefer using the more specific methods to submit messages.
   *
   *         :param content: Content of the message
   *         :param message_type: Type of the message
   *         :param channel: Channel to use (Default: "TEST")
   *         :param storage_engine: Storage engine to use (Default: "storage")
   *         :param allow_inlining: Whether to allow inlining the content of the message (Default: True)
   *         :param sync: If true, waits for the message to be processed by the API server (Default: False)
   *         :param raise_on_rejected: Whether to raise an exception if the message is rejected (Default: True)
   *         """
   *         raise NotImplementedError(
   *             "Did you mean to import `AuthenticatedAlephHttpClient`?"
   *         )
   *
   *     async def ipfs_push(self, content: Mapping) -> str:
   *         """
   *         Push a file to IPFS.
   *
   *         :param content: Content of the file to push
   *         """
   *         raise NotImplementedError()
   *
   *     async def storage_push(self, content: Mapping) -> str:
   *         """
   *         Push arbitrary content as JSON to the storage service.
   *
   *         :param content: The dict-like content to upload
   *         """
   *         raise NotImplementedError()
   */
}
