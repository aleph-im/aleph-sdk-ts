import { CostEstimationInstanceContent } from '../instance/types'
import { MessageCostLine } from '../types/cost'

// ------- POST /api/v0/price/estimate/instance -------

export type EstimateInstanceCostConfiguration = {
  content: CostEstimationInstanceContent
}

export type EstimatedCostsResponse = {
  required_tokens: number
  payment_type: string
  cost: string
  detail: MessageCostLine[]
  charged_address: string
}

// ------- POST /api/v0/price/recalculate -------

export type RecalculateCostsResponse = {
  message: string
  recalculated_count: number
  total_messages: number
  pricing_changes_found: number
  errors: Record<string, any>[]
}
