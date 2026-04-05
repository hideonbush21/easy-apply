export interface User {
  id: string
  nickname: string
  is_admin: boolean
  created_at?: string
  last_login_at?: string | null
  last_login_ip?: string | null
}

export interface UserProfile {
  id: string
  user_id: string
  name: string | null
  home_institution: string | null
  institution_tier: 'c9' | '985' | '211' | 'double_non' | 'overseas' | 'other' | null
  current_major: string | null
  gpa: number | null
  gpa_scale: number | null
  language_scores: { toefl?: number; ielts?: number } | null
  target_countries: string[] | null
  target_majors: string[] | null
  degree_type: 'master' | 'phd' | 'bachelor' | null
  completion_rate: number
  updated_at?: string
}

export interface Experience {
  id: string
  user_id?: string
  type: string
  title: string
  organization: string | null
  role: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  achievements: string[] | null
  skills: string[] | null
  created_at?: string
}

export interface School {
  id: string
  name: string
  name_cn: string | null
  country: string
  ranking: number | null
  majors: string[]
  gpa_requirement: { min: number; preferred: number }
  language_requirement: { toefl?: number; ielts?: number }
  application_deadline: string | null
  description: string | null
  match_score?: number
}

export interface Application {
  id: string
  user_id?: string
  school_id: string
  school?: School
  major: string | null
  status: string
  priority: string | null
  application_deadline: string | null
  applied_at: string | null
  result_date: string | null
  notes: string | null
  created_at: string
  updated_at?: string
}

export interface RecommendationLetter {
  id: string
  user_id?: string
  application_id: string
  content: string
  created_at: string
}

export interface SopLetter {
  id: string
  user_id?: string
  application_id: string
  content: string
  created_at: string
}

export interface PaginatedResponse<T> {
  schools: T[]
  total: number
  page: number
  per_page: number
  pages: number
}
