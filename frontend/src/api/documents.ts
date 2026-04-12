import api from './client'

export interface DocumentGroup {
  application_id: string
  school_name: string | null
  school_name_cn: string | null
  program_name_cn: string | null
  program_name_en: string | null
  sop: LetterData | null
  recommendation: LetterData | null
}

export interface LetterData {
  id: string
  content: string
  created_at: string
  updated_at: string | null
}

export const checkDocuments = () =>
  api.get<{ has_documents: boolean }>('/documents/check')

export const getAllDocuments = () =>
  api.get<{ documents: DocumentGroup[] }>('/documents/all')

export const updateDocument = (letterType: 'sop' | 'recommendation', letterId: string, content: string) =>
  api.put(`/documents/${letterType}/${letterId}`, { content })
