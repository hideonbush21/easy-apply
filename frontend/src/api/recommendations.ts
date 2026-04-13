import api from './client'
import type { RecommendationLetter } from '@/types'

export interface RecommendationContext {
  recommender_type: string        // 推荐人类型
  relationship_context: string    // 认识场景
  key_incident: string            // 具体事件
  quantified_outcome: string      // 可量化成果
}

export const generateRecommendation = (application_id: string, context?: RecommendationContext) =>
  api.post<RecommendationLetter>('/recommendations/generate', { application_id, ...context })

export const getRecommendation = (application_id: string) =>
  api.get<RecommendationLetter>(`/recommendations/${application_id}`)

export const exportRecommendation = (letter_id: string) =>
  api.get<{ content: string; id: string }>(`/recommendations/${letter_id}/export`)
