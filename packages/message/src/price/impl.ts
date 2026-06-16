import { DEFAULT_API_V2, getSocketPath, stripTrailingSlash } from '@aleph-sdk/core'
import axios from 'axios'

import { EstimateInstanceCostConfiguration, EstimatedCostsResponse, RecalculateCostsResponse } from './types'

export class PriceClient {
  apiServer: string

  constructor(apiServer: string = DEFAULT_API_V2) {
    this.apiServer = stripTrailingSlash(apiServer)
  }

  /**
   * Estimates the cost of an instance from its content, without publishing a message.
   *
   * @param config The instance content to estimate.
   */
  async estimateInstanceCost({ content }: EstimateInstanceCostConfiguration): Promise<EstimatedCostsResponse> {
    const response = await axios.post<EstimatedCostsResponse>(
      `${this.apiServer}/api/v0/price/estimate/instance`,
      content,
      { socketPath: getSocketPath() },
    )
    return response.data
  }

  /**
   * Triggers a recalculation of message costs and returns a summary of the changes found.
   */
  async recalculate(): Promise<RecalculateCostsResponse> {
    const response = await axios.post<RecalculateCostsResponse>(
      `${this.apiServer}/api/v0/price/recalculate`,
      undefined,
      { socketPath: getSocketPath() },
    )
    return response.data
  }
}

export default PriceClient
