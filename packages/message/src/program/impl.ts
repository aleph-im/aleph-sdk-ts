import { DEFAULT_API_V2, RequireOnlyOne, stripTrailingSlash } from '@aleph-sdk/core'
import { buildProgramMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'
import {
  ProgramPublishConfiguration,
  ProgramSpawnConfiguration,
  Encoding,
  FunctionTriggers,
  ProgramContent,
  MachineType,
  ProgramMessage,
} from './types'
import { StoreMessageClient } from '../store'
import { BaseMessageClient } from '../base'
import { ItemType, MessageType } from '../types'

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

  // TODO: Check that program_ref, runtime and data_ref exist
  // Guard some numbers values
  async send({
    account,
    channel,
    metadata,
    isPersistent = false,
    storageEngine = ItemType.ipfs,
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
    sync = false,
  }: RequireOnlyOne<ProgramPublishConfiguration, 'programRef' | 'file'>): Promise<ProgramMessage> {
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
      volumes: volumes,
      variables,
    }

    const builtMessage = buildProgramMessage({
      account,
      channel,
      timestamp,
      storageEngine,
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
      storageEngine,
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
