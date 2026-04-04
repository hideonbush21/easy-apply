import api from './client'
import type { RecommendationLetter } from '@/types'

export const generateRecommendation = (application_id: string) =>
  api.post<RecommendationLetter>('/recommendations/generate', { application_id })

export const getRecommendation = (application_id: string) =>
  api.get<RecommendationLetter>(`/recommendations/${application_id}`)

export const exportRecommendation = (letter_id: string) =>
  api.get<{ content: string; id: string }>(`/recommendations/${letter_id}/export`)
