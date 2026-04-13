import api from './client'
import type { SopLetter } from '@/types'

export const generateSop = (application_id: string) =>
  api.post<SopLetter>('/sop/generate', { application_id })

export const getSop = (application_id: string) =>
  api.get<SopLetter>(`/sop/${application_id}`)

export const deleteSop = (letter_id: string) =>
  api.delete(`/sop/letter/${letter_id}`)

export const humanizeText = (content: string) =>
  api.post<{ humanized_content: string }>('/sop/humanize', { content })
