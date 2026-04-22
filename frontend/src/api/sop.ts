import api from './client'
import type { SopLetter } from '@/types'

/** Enqueue async SoP generation, returns task_id */
export const generateSop = (application_id: string) =>
  api.post<{ task_id: string }>('/sop/generate', { application_id })

/** Build SSE URL for tracking generation progress */
export function sopStatusUrl(taskId: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  return `${base}/sop/generate/status/${taskId}`
}

export const getSop = (application_id: string) =>
  api.get<SopLetter>(`/sop/${application_id}`)

export const deleteSop = (letter_id: string) =>
  api.delete(`/sop/letter/${letter_id}`)

export const humanizeText = (content: string) =>
  api.post<{ humanized_content: string }>('/sop/humanize', { content })
