import api from './client'
import type { Application } from '@/types'

export interface CreateApplicationData {
  program_id?: string
  school_id?: string
  major?: string
  status?: string
  priority?: string
  application_deadline?: string
  notes?: string
}

export const getApplications = () =>
  api.get<Application[]>('/applications/')

export const createApplication = (data: CreateApplicationData) =>
  api.post<Application>('/applications/', data)

export const updateApplication = (id: string, data: Partial<Application>) =>
  api.put<Application>(`/applications/${id}`, data)

export const deleteApplication = (id: string) =>
  api.delete(`/applications/${id}`)

export const getDeadlines = () =>
  api.get<Application[]>('/applications/deadlines')
