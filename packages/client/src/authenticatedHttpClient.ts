import { Account } from '@aleph-sdk/account'
import { DEFAULT_API_V2, RequireOnlyOne } from '@aleph-sdk/core'
import {
  AggregatePublishConfiguration,
  ForgetPublishConfiguration,
  InstancePublishConfiguration,
  PostPublishConfiguration,
  ProgramPublishConfiguration,
  StorePublishConfiguration,
} from '@aleph-sdk/message'

import AlephHttpClient from './httpClient'

export class AuthenticatedAlephHttpClient extends AlephHttpClient {
  account: Account
  constructor(account: Account, apiServer: string = DEFAULT_API_V2) {
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
  async createPost<Content = any>(config: Omit<PostPublishConfiguration<Content>, 'account'>) {
    return await this.postClient.send<Content>({
      account: this.account,
      ...config,
    } as PostPublishConfiguration<Content>)
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
  async createAggregate<Content>(config: Omit<AggregatePublishConfiguration<Content>, 'account'>) {
    return await this.aggregateClient.send<Content>({
      account: this.account,
      ...config,
    } as AggregatePublishConfiguration<Content>)
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
  async createStore(config: RequireOnlyOne<Omit<StorePublishConfiguration, 'account'>, 'fileObject' | 'fileHash'>) {
    return await this.storeClient.send({
      account: this.account,
      ...config,
    } as RequireOnlyOne<StorePublishConfiguration, 'fileObject' | 'fileHash'>)
  }

  /**
   * Post a (create) PROGRAM message.
   *
   * @param channel The channel in which the message will be published
   * @param isPersistent Whether the program should run continuously or on-demand (Default: False)
   * @param storageEngine Storage engine to use (Default: "storage")
   * @param file File to upload
   * @param encoding Encoding for the uploaded code file to use (Default: Encoding.zip)
   * @param programRef (alternatively) item_hash of the STORE message containing the program
   * @param entrypoint Entrypoint to run, e.g. "main:app"
   * @param subscriptions Patterns of aleph.im messages to forward to the program's event receiver
   * @param memory Memory in MB for the VM to be allocated (Default: 128)
   * @param vcpus Number of vCPUs to allocate (Default: 1)
   * @param runtime Runtime image to use, accessed by its item hash
   * @param volumes Volumes to mount
   * @param metadata Metadata to attach to the message
   * @param variables Environment variables to pass to the program
   * @param payment Payment configuration for the program
   * @param sync If true, waits for the message to be processed by the API server
   */
  async createProgram(config: Omit<ProgramPublishConfiguration, 'account'>) {
    return await this.programClient.publish({
      account: this.account,
      ...config,
    } as ProgramPublishConfiguration)
  }

  /**
   * Create a VM instance on the network by posting an INSTANCE message. It will be rejected by the network if the account does not have enough funds.
   *
   * @param channel The channel in which the message will be published
   * @param metadata Additional information about the VM
   * @param variables Environment variables to pass to the VM
   * @param authorizedKeys SSH authorized keys to use for the VM
   * @param resources Resources to allocate to the VM, such as memory and CPU
   * @param requirements Requirements for the VM host
   * @param environment Environment to use for the VM
   * @param image Image to use for the VM
   * @param volumes Volumes to mount
   * @param storageEngine Storage engine to use (Default: "storage")
   * @param payment Payment configuration for the VM
   * @param sync If true, waits for the message to be processed by the API server (Default: True)
   */
  async createInstance(config: Omit<InstancePublishConfiguration, 'account'>) {
    return await this.instanceClient.send({
      account: this.account,
      ...config,
    } as InstancePublishConfiguration)
  }

  /**
   * Create a FORGET message to remove one or multiple messages from the network.
   *
   * @param hashes The hashes of the messages to forget
   * @param channel The channel in which the message will be published
   * @param storageEngine Storage engine to use (Default: "inline")
   * @param reason Reason for forgetting the message
   * @param sync If true, waits for the message to be processed by the API server (Default: False)
   */
  async forget(config: Omit<ForgetPublishConfiguration, 'account'>) {
    return await this.forgetClient.send({
      account: this.account,
      ...config,
    } as ForgetPublishConfiguration)
  }
}

export default AuthenticatedAlephHttpClient
