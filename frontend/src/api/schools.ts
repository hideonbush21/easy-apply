import api from './client'
import type { School, PaginatedResponse } from '@/types'

export interface SchoolFilters {
  country?: string
  major?: string
  ranking_max?: number
  page?: number
  per_page?: number
}

export interface RecommendedProgram {
  id: string
  name_cn: string | null
  name_en: string | null
  major_category: string | null
  department: string | null
  duration: string | null
  tuition: string | null
  tuition_cny: string | null
  ielts_requirement: number | null
  toefl_requirement: number | null
  deadline_26fall: string | null
  program_url: string | null
  similarity_score: number
}

export interface RecommendedSchool {
  school_name_en: string
  school_name_cn: string | null
  ranking: number | null
  case_count: number
  avg_gpa: number | null
  programs: RecommendedProgram[]
}

export interface ProfileBasedResult {
  schools: RecommendedSchool[]
  match_level: 'exact' | 'widened_0.5' | 'widened_0.8' | 'no_major'
  total_cases_found: number
  category: string | null
}

export const getSchools = (params?: SchoolFilters) =>
  api.get<PaginatedResponse<School>>('/schools/', { params })

export const getSchool = (id: string) =>
  api.get<School>(`/schools/${id}`)

export const getProfileBasedRecommendation = (params?: { top_schools?: number; top_programs?: number }) =>
  api.post<ProfileBasedResult>('/school-recommendation/profile-based', params ?? {})
