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
  majors: string[] | null
  gpa_requirement: { min: number; preferred: number } | null
  application_deadline: string | null
  description: string | null
  // aggregated from programs
  ielts_min: number | null
  deadline_earliest: string | null
  programs_count: number
  match_score?: number
}

export interface Application {
  id: string
  user_id?: string
  school_id: string | null
  school?: School
  program_id: string | null
  program_name_cn: string | null
  program_name_en: string | null
  program_url: string | null
  department: string | null
  duration: string | null
  tuition_cny: number | null
  ielts_requirement: unknown
  toefl_requirement: unknown
  school_name: string | null
  school_name_cn: string | null
  school_ranking: number | null
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
