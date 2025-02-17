import { Blockchain, DEFAULT_API_V2 } from '@aleph-sdk/core'

import {
  CostEstimationProgramContent,
  CostEstimationProgramPublishConfiguration,
  Encoding,
  FunctionTriggers,
  ProgramContent,
  ProgramPublishConfiguration,
  ProgramSpawnConfiguration,
} from './types'
import { BaseMessageClient } from '../base'
import { StoreMessageClient } from '../store'
import { ItemType, MachineType, MessageType, PaymentType, ProgramMessage } from '../types'
import { DefaultMessageClient } from '../utils/base'
import { buildMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'

export class ProgramMessageClient extends DefaultMessageClient<
  ProgramPublishConfiguration,
  ProgramContent,
  CostEstimationProgramPublishConfiguration,
  CostEstimationProgramContent
> {
  constructor(
    apiServer: string = DEFAULT_API_V2,
    protected baseMessageClient: BaseMessageClient = new BaseMessageClient(apiServer),
    protected storeMessageClient: StoreMessageClient = new StoreMessageClient(apiServer),
  ) {
    super(apiServer, MessageType.program)
  }

  async publish(conf: ProgramPublishConfiguration): Promise<ProgramMessage> {
    const { account, channel, sync = true } = conf
    const content = await this.prepareMessageContent(conf)

    const builtMessage = buildMessage(
      {
        account,
        channel,
        content,
        timestamp: content.time,
        storageEngine: ItemType.inline,
      },
      this.messageType,
    )

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      apiServer: this.apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: this.apiServer,
      sync,
    })

    return message
  }

  async spawn({
    account,
    channel,
    metadata,
    isPersistent = false,
    storageEngine = ItemType.ipfs,
    programRef,
    entrypoint,
    encoding = Encoding.zip,
    subscriptions,
    memory = 128,
    vcpus = 1,
    runtime = '63f07193e6ee9d207b7d1fcf8286f9aee34e6f12f101d2ec77c1229f92964696',
    volumes = [],
    variables = {},
    payment = {
      chain: Blockchain.ETH,
      type: PaymentType.hold,
    },
    sync = true,
  }: ProgramSpawnConfiguration): Promise<ProgramMessage> {
    return await this.publish({
      account,
      channel,
      metadata,
      isPersistent,
      storageEngine,
      programRef,
      entrypoint,
      encoding,
      subscriptions,
      memory,
      vcpus,
      runtime,
      volumes,
      variables,
      payment,
      sync,
    })
  }

  protected async prepareMessageContent({
    account,
    channel,
    metadata,
    isPersistent = false,
    storageEngine = ItemType.ipfs,
    file,
    programRef,
    encoding = Encoding.zip,
    entrypoint,
    subscriptions,
    memory = 128,
    vcpus = 1,
    runtime = '63f07193e6ee9d207b7d1fcf8286f9aee34e6f12f101d2ec77c1229f92964696',
    volumes = [],
    variables = {},
    payment = {
      chain: Blockchain.ETH,
      type: PaymentType.hold,
    },
    sync = true,
  }: ProgramPublishConfiguration): Promise<ProgramContent> {
    const timestamp = Date.now() / 1000
    if (!programRef && !file) throw new Error('You need to specify a file to upload or a programRef to load.')
    if (programRef && file) throw new Error("You can't load a file and a programRef at the same time.")

    // Store the source code of the program and retrieve the hash.
    if (!programRef && file) {
      programRef = (
        await this.storeMessageClient.send({
          channel,
          account,
          storageEngine,
          fileObject: file,
          sync,
        })
      ).item_hash
    } else if (programRef && !file) {
      try {
        const fetchCode = await this.baseMessageClient.get<MessageType.store>({
          hash: programRef,
        })
        if (fetchCode.sender != account.address)
          console.warn(
            'Caution, you are not the owner of the code. Be aware that the codebase can be changed at any time by the owner.',
          )
      } catch (e) {
        throw new Error(`The program ref: ${programRef} does not exist on Aleph network.`)
      }
    }

    let triggers: FunctionTriggers = { http: true, persistent: isPersistent }
    if (subscriptions) triggers = { ...triggers, message: subscriptions }

    return {
      address: account.address,
      time: timestamp,
      type: MachineType.vm_function,
      allow_amend: false,
      code: {
        encoding, // retrieve the file format or params
        entrypoint: entrypoint,
        ref: programRef as string,
        use_latest: true,
      },
      metadata,
      on: triggers,
      environment: {
        reproducible: false,
        internet: true,
        aleph_api: true,
        shared_cache: false,
      },
      resources: {
        vcpus,
        memory,
        seconds: 30,
      },
      runtime: {
        ref: runtime,
        use_latest: true,
        comment: 'Aleph Alpine Linux with Python 3.12',
      },
      volumes,
      variables,
      payment,
    }
  }
}

export default ProgramMessageClient
