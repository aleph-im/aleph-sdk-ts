import { Blockchain, DEFAULT_API_V2, stripTrailingSlash } from '@aleph-sdk/core'
import { defaultResources, MAXIMUM_DISK_SIZE, defaultInstanceExecutionEnvironment } from '../utils/constants'
import { buildInstanceMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'
import { InstancePublishConfiguration, InstanceContent } from './types'
import { InstanceMessage, ItemType, MachineVolume, PaymentType, VolumePersistence } from '../types'

export class InstanceMessageClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  // TODO: Check that program_ref, runtime and data_ref exist
  // Guard some numbers values
  async send({
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
    storageEngine = ItemType.ipfs,
    payment = {
      chain: Blockchain.ETH,
      type: PaymentType.hold,
    },
    sync = true,
  }: InstancePublishConfiguration): Promise<InstanceMessage> {
    const timestamp = Date.now() / 1000
    const { address } = account
    // To remove @typescript-eslint/no-unused-vars at buildtime, without removing the argument
    storageEngine

    const mergedResources = {
      ...defaultResources,
      ...resources,
    }

    const mergedEnvironment = {
      ...defaultInstanceExecutionEnvironment,
      ...environment,
    }

    const size_mib = mergedResources.memory * 10 > MAXIMUM_DISK_SIZE ? MAXIMUM_DISK_SIZE : mergedResources.memory * 10

    const rootfs = {
      parent: {
        ref: image as string,
        use_latest: true,
      },
      persistence: VolumePersistence.host,
      size_mib,
    }

    const instanceContent: InstanceContent = {
      address,
      time: timestamp,
      metadata,
      authorized_keys,
      volumes: volumes as MachineVolume[],
      variables,
      requirements,
      allow_amend: false,
      resources: mergedResources,
      environment: mergedEnvironment,
      rootfs,
      payment,
    }

    const builtMessage = buildInstanceMessage({
      account,
      channel,
      timestamp,
      storageEngine: ItemType.inline,
      content: instanceContent,
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
}

export default InstanceMessageClient
