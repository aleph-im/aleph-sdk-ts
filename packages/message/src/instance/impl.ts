import { Blockchain, DEFAULT_API_V2 } from '@aleph-sdk/core'

import {
  CostEstimationInstanceContent,
  CostEstimationInstancePublishConfiguration,
  InstanceContent,
  InstancePublishConfiguration,
} from './types'
import { InstanceMessage, ItemType, MessageType, PaymentType, VolumePersistence } from '../types'
import { DefaultMessageClient } from '../utils/base'
import { defaultInstanceExecutionEnvironment, defaultResources, MAXIMUM_DISK_SIZE } from '../utils/constants'
import { buildMessage } from '../utils/messageBuilder'
import { prepareAlephMessage } from '../utils/publish'
import { broadcast } from '../utils/signature'

export class InstanceMessageClient extends DefaultMessageClient<
  InstancePublishConfiguration,
  InstanceContent,
  CostEstimationInstancePublishConfiguration,
  CostEstimationInstanceContent
> {
  constructor(apiServer: string = DEFAULT_API_V2) {
    super(apiServer, MessageType.instance)
  }

  // TODO: Check that program_ref, runtime and data_ref exist
  // Guard some numbers values
  async send(conf: InstancePublishConfiguration): Promise<InstanceMessage> {
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

  protected async prepareMessageContent({
    account,
    metadata,
    variables,
    authorized_keys,
    resources,
    requirements,
    environment,
    image = 'f7e68c568906b4ebcd3cd3c4bfdff96c489cd2a9ef73ba2d7503f244dfd578de',
    volumes = [],
    storageEngine = ItemType.ipfs,
    payment = {
      chain: Blockchain.ETH,
      type: PaymentType.hold,
    },
  }: InstancePublishConfiguration): Promise<InstanceContent> {
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

    if (mergedEnvironment.trusted_execution === null) delete mergedEnvironment.trusted_execution

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
      volumes,
      variables,
      requirements,
      allow_amend: false,
      resources: mergedResources,
      environment: mergedEnvironment,
      rootfs,
      payment,
    }

    if (instanceContent.requirements === null) delete instanceContent.requirements

    return instanceContent
  }
}

export default InstanceMessageClient
