import { Blockchain, DEFAULT_API_V2, stripTrailingSlash } from '@aleph-sdk/core'

import {
  Encoding,
  FunctionTriggers,
  ProgramContent,
  ProgramPublishConfiguration,
  ProgramSpawnConfiguration,
} from './types'
import { BaseMessageClient } from '../base'
import { StoreMessageClient } from '../store'
import { ItemType, MachineType, MessageType, PaymentType, ProgramMessage } from '../types'
import { buildProgramMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'

export class ProgramMessageClient {
  apiServer: string
  protected baseMessageClient: BaseMessageClient
  protected storeMessageClient: StoreMessageClient

  constructor(
    apiServer: string = DEFAULT_API_V2,
    baseMessageClient?: BaseMessageClient,
    storeMessageClient?: StoreMessageClient,
  ) {
    this.apiServer = stripTrailingSlash(apiServer)
    this.baseMessageClient = baseMessageClient || new BaseMessageClient(apiServer)
    this.storeMessageClient = storeMessageClient || new StoreMessageClient(apiServer)
  }

  async publish({
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
    runtime = 'bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4',
    volumes = [],
    variables = {},
    payment = {
      chain: Blockchain.ETH,
      type: PaymentType.hold,
    },
    sync = true,
  }: ProgramPublishConfiguration): Promise<ProgramMessage> {
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

    const programContent: ProgramContent = {
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
        comment: 'Aleph Alpine Linux with Python 3.8',
      },
      volumes,
      variables,
      payment,
    }

    const builtMessage = buildProgramMessage({
      account,
      channel,
      timestamp,
      storageEngine: ItemType.inline,
      content: programContent,
    })

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
    runtime = 'bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4',
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
}

export default ProgramMessageClient
