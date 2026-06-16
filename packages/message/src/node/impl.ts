import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios from 'axios'

import { ChannelsListResponse, NodePublicInfo, VersionResponse } from './types'

export class NodeClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Retrieves the node's public information, including its P2P multiaddresses.
   */
  async getPublicInfo(): Promise<NodePublicInfo> {
    const response = await axios.get<NodePublicInfo>(`${this.apiServer}/api/v0/info/public.json`, {
      socketPath: getSocketPath(),
    })
    return response.data
  }

  /**
   * Retrieves the list of channels known to the node.
   */
  async listChannels(): Promise<ChannelsListResponse> {
    const response = await axios.get<ChannelsListResponse>(`${this.apiServer}/api/v0/channels/list.json`, {
      socketPath: getSocketPath(),
    })
    return response.data
  }

  /**
   * Retrieves the node software version.
   */
  async getVersion(): Promise<VersionResponse> {
    const response = await axios.get<VersionResponse>(`${this.apiServer}/version`, {
      socketPath: getSocketPath(),
    })
    return response.data
  }
}

export default NodeClient
