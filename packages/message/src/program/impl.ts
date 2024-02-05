import { DEFAULT_API_V2, RequireOnlyOne } from '@aleph-sdk/core'
import { MessageBuilder } from '../utils/messageBuilder'
import { PutContentToStorageEngine } from '../utils/publish'
import { SignAndBroadcast } from '../utils/signature'
import {
  ProgramPublishConfiguration,
  ProgramSpawnConfiguration,
  Encoding,
  FunctionTriggers,
  ProgramContent,
  MachineType,
  ProgramMessage,
} from './types'
import { StoreMessage, StoreMessageClient } from '../store'
import { BaseMessageClient } from '../base'
import { ItemType, MessageType } from '../types'

export class ProgramMessageClient {
  constructor(
    protected baseMessageClient: BaseMessageClient = new BaseMessageClient(),
    protected storeMessageClient: StoreMessageClient = new StoreMessageClient(),
  ) {}

  // TODO: Check that program_ref, runtime and data_ref exist
  // Guard some numbers values
  async send({
    account,
    channel,
    metadata,
    isPersistent = false,
    inlineRequested = true,
    storageEngine = ItemType.ipfs,
    APIServer = DEFAULT_API_V2,
    file,
    programRef,
    encoding = Encoding.zip,
    entrypoint,
    subscription,
    memory = 128,
    vcpus = 1,
    runtime = 'bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4',
    volumes = [],
    variables = {},
  }: RequireOnlyOne<ProgramPublishConfiguration, 'programRef' | 'file'>): Promise<ProgramMessage> {
    const timestamp = Date.now() / 1000
    if (!programRef && !file) throw new Error('You need to specify a file to upload or a programRef to load.')
    if (programRef && file) throw new Error("You can't load a file and a programRef at the same time.")

    // Store the source code of the program and retrieve the hash.
    if (!programRef && file) {
      programRef = (
        await this.storeMessageClient.send({
          channel,
          APIServer,
          account,
          storageEngine,
          fileObject: file,
        })
      ).item_hash
    } else if (programRef && !file) {
      try {
        const fetchCode = await this.baseMessageClient.get<StoreMessage>({
          hash: programRef,
          APIServer: DEFAULT_API_V2,
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
    if (subscription) triggers = { ...triggers, message: subscription }

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
    }

    const message = MessageBuilder<ProgramContent, MessageType.program>({
      account,
      channel,
      timestamp,
      storageEngine,
      content: programContent,
      type: MessageType.program,
    })

    await PutContentToStorageEngine({
      message: message,
      content: programContent,
      inline: inlineRequested,
      APIServer,
    })

    await SignAndBroadcast({
      message: message,
      account,
      APIServer,
    })

    return message
  }

  async spawn({
    account,
    channel,
    metadata,
    isPersistent = false,
    inlineRequested = true,
    storageEngine = ItemType.ipfs,
    APIServer = DEFAULT_API_V2,
    programRef,
    entrypoint,
    encoding = Encoding.zip,
    subscription,
    memory = 128,
    vcpus = 1,
    runtime = 'bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4',
    volumes = [],
    variables = {},
  }: ProgramSpawnConfiguration): Promise<ProgramMessage> {
    return this.send({
      account,
      channel,
      metadata,
      isPersistent,
      inlineRequested,
      storageEngine,
      APIServer,
      programRef,
      entrypoint,
      encoding,
      subscription,
      memory,
      vcpus,
      runtime,
      volumes,
      variables,
    })
  }
}

export default ProgramMessageClient
