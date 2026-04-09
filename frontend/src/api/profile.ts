import api from './client'
import type { UserProfile, Experience } from '@/types'

export const getProfile = () =>
  api.get<UserProfile>('/profile/')

export const updateProfile = (data: Partial<UserProfile>) =>
  api.put<UserProfile>('/profile/', data)

export const getCompletion = () =>
  api.get<{ completion_rate: number }>('/profile/completion')

export const getExperiences = () =>
  api.get<Experience[]>('/experiences/')

export const createExperience = (data: Omit<Experience, 'id' | 'user_id' | 'created_at'>) =>
  api.post<Experience>('/experiences/', data)

export const updateExperience = (id: string, data: Partial<Experience>) =>
  api.put<Experience>(`/experiences/${id}`, data)

export const deleteExperience = (id: string) =>
  api.delete(`/experiences/${id}`)

export const syncOnboarding = (data: Record<string, unknown>) =>
  api.post('/profile/onboarding', data)
