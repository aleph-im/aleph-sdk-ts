import { DEFAULT_API_V2 } from '@aleph-sdk/core'
import { defaultResources, defaultExecutionEnvironment } from '../utils/constants'
import { buildInstanceMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'
import { InstancePublishConfiguration, InstanceContent, InstanceMessage } from './types'
import { ItemType, VolumePersistence } from '../types'

export class InstanceMessageClient {
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
    inlineRequested = true,
    storageEngine = ItemType.ipfs,
    apiServer = DEFAULT_API_V2,
  }: InstancePublishConfiguration): Promise<InstanceMessage> {
    const timestamp = Date.now() / 1000
    const { address } = account

    const mergedResources = {
      ...defaultResources,
      ...resources,
    }

    const mergedEnvironment = {
      ...defaultExecutionEnvironment,
      ...environment,
    }

    const rootfs = {
      parent: {
        ref: image,
        use_latest: true,
      },
      persistence: VolumePersistence.host,
      size_mib: mergedResources.memory * 10,
    }

    const instanceContent: InstanceContent = {
      address,
      time: timestamp,
      metadata,
      authorized_keys,
      volumes,
      variables,
      requirements,
      allow_amend: false,
      resources: mergedResources,
      environment: mergedEnvironment,
      rootfs,
    }

    const builtMessage = buildInstanceMessage({
      account,
      channel,
      timestamp,
      storageEngine,
      content: instanceContent,
    })

    const hashedMessage = await prepareAlephMessage({
      message: builtMessage,
      content: instanceContent,
      inline: inlineRequested,
      apiServer,
    })

    const { message } = await broadcast({
      message: hashedMessage,
      account,
      apiServer: apiServer,
    })

    return message
  }
}

export default InstanceMessageClient
