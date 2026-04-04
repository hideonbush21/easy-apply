import api from './client'
import type { School, PaginatedResponse } from '@/types'

export interface SchoolFilters {
  country?: string
  major?: string
  ranking_max?: number
  page?: number
  per_page?: number
}

export const getSchools = (params?: SchoolFilters) =>
  api.get<PaginatedResponse<School>>('/schools/', { params })

export const getSchool = (id: string) =>
  api.get<School>(`/schools/${id}`)

export const getRecommendations = () =>
  api.get<{ reach: School[]; match: School[]; safety: School[] }>('/schools/recommendations')
