import { DEFAULT_API_V2 } from '@aleph-sdk/core'
import { Account } from '@aleph-sdk/account'
import {
  ItemType,
  MessageType,
  InstanceMessage,
  MachineVolume,
  HostRequirements,
  FunctionEnvironment,
  MachineResources,
  VolumePersistence,
} from '../types'
import { InstanceContent } from './types'
import { PutContentToStorageEngine } from '../create/publish'
import { SignAndBroadcast } from '../create/signature'
import { defaultExecutionEnvironment, defaultResources } from '../constants'
import { MessageBuilder } from '../messageBuilder'

export type InstancePublishConfiguration = {
  account: Account
  channel: string
  metadata?: Record<string, unknown>
  variables?: Record<string, string>
  authorized_keys?: string[]
  resources?: Partial<MachineResources>
  requirements?: HostRequirements
  environment?: Partial<FunctionEnvironment>
  image?: string
  volumes?: MachineVolume[]
  inlineRequested?: boolean
  storageEngine?: ItemType.ipfs | ItemType.storage
  APIServer?: string
}

// TODO: Check that program_ref, runtime and data_ref exist
// Guard some numbers values
export async function Publish({
  account,
  channel,
  metadata,
  variables,
  authorized_keys,
  resources,
  requirements,
  environment,
  image = '549ec451d9b099cad112d4aaa2c00ac40fb6729a92ff252ff22eef0b5c3cb613',
  volumes = [],
  inlineRequested = true,
  storageEngine = ItemType.ipfs,
  APIServer = DEFAULT_API_V2,
}: InstancePublishConfiguration): Promise<InstanceMessage> {
  const timestamp = Date.now() / 1000
  const { address } = account

  const instanceContent: InstanceContent = {
    address,
    time: timestamp,
    metadata,
    authorized_keys,
    volumes,
    variables,
    requirements,
    allow_amend: false,
    resources: {
      ...defaultResources,
      ...resources,
    },
    environment: {
      ...defaultExecutionEnvironment,
      ...environment,
    },
    rootfs: {
      parent: {
        ref: image,
        use_latest: true,
      },
      persistence: VolumePersistence.host,
      size_mib: 5000,
    },
  }

  const message = MessageBuilder<InstanceContent, MessageType.instance>({
    account,
    channel,
    timestamp,
    storageEngine,
    content: instanceContent,
    type: MessageType.instance,
  })

  await PutContentToStorageEngine({
    message: message,
    content: instanceContent,
    inline: inlineRequested,
    APIServer,
  })

  await SignAndBroadcast({
    message: message,
    account,
    APIServer,
  })

  return message as unknown as InstanceMessage
}
