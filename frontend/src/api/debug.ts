import api from './client'

export const getDebugTables = () =>
  api.get<{ tables: DebugTable[] }>('/debug/tables')

export const getDebugTableRows = (tableName: string, limit = 50, offset = 0) =>
  api.get<DebugRowsResponse>(
    `/debug/tables/${tableName}/rows`, { params: { limit, offset } }
  )

export const createDebugRow = (tableName: string, data: Record<string, unknown>) =>
  api.post<{ row: Record<string, unknown> }>(`/debug/tables/${tableName}/rows`, data)

export const updateDebugRow = (tableName: string, pk: Record<string, unknown>, data: Record<string, unknown>) =>
  api.put<{ row: Record<string, unknown> }>(`/debug/tables/${tableName}/rows`, { pk, data })

export const deleteDebugRow = (tableName: string, pk: Record<string, unknown>) =>
  api.delete(`/debug/tables/${tableName}/rows`, { data: { pk } })

// ── Logs ──

export const getDebugLogs = (params?: { level?: string; search?: string; limit?: number }) =>
  api.get<DebugLogsResponse>('/debug/logs', { params })

export const clearDebugLogs = () =>
  api.post('/debug/logs/clear')

export interface DebugColumn {
  name: string
  type: string
  nullable: boolean
  default: string | null
}

export interface DebugTable {
  table_name: string
  row_count: number
  columns: DebugColumn[]
  primary_keys: string[]
}

export interface DebugRowsResponse {
  columns: string[]
  rows: Record<string, unknown>[]
  primary_keys: string[]
  limit: number
  offset: number
}

export interface DebugLogEntry {
  timestamp: string
  level: string
  logger: string
  message: string
  file: string
  line: number
}

export interface DebugLogsResponse {
  logs: DebugLogEntry[]
  total_buffered: number
}

// ── SoP Agent Debug ──

export interface SopAgentTaskSummary {
  task_id: string
  event_count: number
  started_at?: number
  ended_at?: number
  school?: string
  program?: string
  final_score?: number
  iterations?: number
}

export interface SopAgentTraceEvent {
  ts: number
  node: string
  type: string
  [key: string]: unknown
}

export const getSopAgentTasks = () =>
  api.get<{ tasks: SopAgentTaskSummary[] }>('/debug/sop-agent/tasks')

export const getSopAgentTrace = (taskId: string) =>
  api.get<{ task_id: string; events: SopAgentTraceEvent[] }>(`/debug/sop-agent/tasks/${taskId}`)
