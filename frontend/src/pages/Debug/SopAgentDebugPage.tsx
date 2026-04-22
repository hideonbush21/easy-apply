import { useState, useEffect } from 'react'
import { getSopAgentTasks, getSopAgentTrace } from '@/api/debug'
import type { SopAgentTaskSummary, SopAgentTraceEvent } from '@/api/debug'
import {
  Bot,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

const NODE_META: Record<string, { label: string; color: string; icon: typeof Bot }> = {
  input:    { label: '用户输入',   color: '#6366f1', icon: FileText },
  draft:    { label: '草稿生成',   color: '#0ea5e9', icon: FileText },
  critique: { label: '质量评审',   color: '#f59e0b', icon: Search },
  router:   { label: '路由决策',   color: '#8b5cf6', icon: ArrowRight },
  output:   { label: '最终输出',   color: '#10b981', icon: CheckCircle },
}

export default function SopAgentDebugPage() {
  const [tasks, setTasks] = useState<SopAgentTaskSummary[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [events, setEvents] = useState<SopAgentTraceEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [traceLoading, setTraceLoading] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  const fetchTasks = () => {
    setLoading(true)
    getSopAgentTasks()
      .then(r => { setTasks(r.data.tasks); setError('') })
      .catch(e => setError(e.response?.data?.error || '获取任务列表失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [])

  const selectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setTraceLoading(true)
    setExpandedIdx(new Set())
    getSopAgentTrace(taskId)
      .then(r => { setEvents(r.data.events); setError('') })
      .catch(e => setError(e.response?.data?.error || '获取 trace 失败'))
      .finally(() => setTraceLoading(false))
  }

  const toggleExpand = (idx: number) => {
    setExpandedIdx(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const fmtTime = (ts?: number) => {
    if (!ts) return '—'
    const d = new Date(ts * 1000)
    return d.toLocaleString('zh-CN', { hour12: false })
  }

  const fmtDuration = (start?: number, end?: number) => {
    if (!start || !end) return ''
    const sec = end - start
    return sec < 60 ? `${sec.toFixed(1)}s` : `${(sec / 60).toFixed(1)}min`
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>文书 Agent 调试</h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              SoP Agent Pipeline · draft → critique → revise → output
            </p>
          </div>
        </div>
        <button onClick={fetchTasks} disabled={loading} style={toolBtnStyle}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          刷新
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13, marginBottom: 12, flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>
        {/* Task list (left panel) */}
        <div style={{ width: 300, flexShrink: 0, overflow: 'auto', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
            最近任务 ({tasks.length})
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              {loading ? '加载中...' : '暂无 Agent 任务记录'}
            </div>
          ) : tasks.map(t => (
            <div
              key={t.task_id}
              onClick={() => selectTask(t.task_id)}
              style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb',
                background: selectedTaskId === t.task_id ? '#f0f9ff' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {t.final_score != null ? (
                  t.final_score >= 7 ? <CheckCircle size={14} color="#10b981" /> : <AlertTriangle size={14} color="#f59e0b" />
                ) : <XCircle size={14} color="#9ca3af" />}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  {t.school || '未知学校'} · {t.program || '未知项目'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#9ca3af' }}>
                <span>{fmtTime(t.started_at)}</span>
                {t.final_score != null && (
                  <span style={{ color: t.final_score >= 7 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {t.final_score}分
                  </span>
                )}
                {t.iterations != null && <span>{t.iterations}轮</span>}
                <span>{fmtDuration(t.started_at, t.ended_at)}</span>
              </div>
              <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 2, fontFamily: 'monospace' }}>
                {t.task_id.slice(0, 16)}…
              </div>
            </div>
          ))}
        </div>

        {/* Trace detail (right panel) */}
        <div style={{ flex: 1, overflow: 'auto', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
          {!selectedTaskId ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              <Bot size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>选择左侧任务查看完整 Pipeline Trace</p>
            </div>
          ) : traceLoading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>加载中...</div>
          ) : (
            <div style={{ padding: 0 }}>
              {/* Timeline header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Pipeline Trace</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{selectedTaskId}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{events.length} events</span>
              </div>

              {/* Timeline events */}
              <div style={{ padding: '8px 0' }}>
                {events.map((ev, i) => {
                  const meta = NODE_META[ev.node] || { label: ev.node, color: '#6b7280', icon: FileText }
                  const Icon = meta.icon
                  const isExpanded = expandedIdx.has(i)

                  return (
                    <div key={i} style={{ position: 'relative' }}>
                      {/* Timeline line */}
                      {i < events.length - 1 && (
                        <div style={{
                          position: 'absolute', left: 30, top: 36, bottom: 0, width: 2,
                          background: '#e5e7eb',
                        }} />
                      )}

                      <div
                        onClick={() => toggleExpand(i)}
                        style={{
                          display: 'flex', gap: 12, padding: '10px 20px', cursor: 'pointer',
                          background: isExpanded ? '#fafbfc' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                      >
                        {/* Node icon */}
                        <div style={{
                          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                          background: meta.color + '18', border: `1.5px solid ${meta.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: 2,
                        }}>
                          <Icon size={12} color={meta.color} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isExpanded ? <ChevronDown size={12} color="#9ca3af" /> : <ChevronRight size={12} color="#9ca3af" />}
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 4,
                              background: meta.color + '18', color: meta.color,
                            }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>{ev.type}</span>
                            <span style={{ fontSize: 10, color: '#d1d5db', marginLeft: 'auto', fontFamily: 'monospace' }}>
                              {fmtTime(ev.ts as number)}
                            </span>
                          </div>

                          {/* Summary line */}
                          <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>
                            {renderSummary(ev)}
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div style={{
                              marginTop: 8, padding: 12, borderRadius: 8,
                              background: '#0f172a', color: '#e2e8f0',
                              fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                              maxHeight: 500, overflow: 'auto',
                            }}>
                              {JSON.stringify(stripPreview(ev), null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/** One-line summary for each event type */
function renderSummary(ev: SopAgentTraceEvent): string {
  switch (ev.type) {
    case 'user_context':
      return `${ev.school_name} · ${ev.program_name} · ${ev.experience_count}段经历`
    case 'initial_draft':
      return `初稿 · ${ev.word_count} words · iteration ${ev.iteration}`
    case 'revision':
      return `修改稿 · ${ev.word_count} words · iteration ${ev.iteration} · 修复: ${(ev.issues_addressed as string[])?.join(', ')}`
    case 'evaluation':
      return `得分 ${ev.total_score} · ${ev.passed ? '达标 ✓' : '未达标 ✗'} · ${(ev.issues as unknown[])?.length || 0} issues · 解析 ${ev.parse_attempts} 次`
    case 'parse_error':
      return `JSON 解析失败 (attempt ${ev.attempt}): ${(ev.error as string)?.slice(0, 80)}`
    case 'decision':
      return `score=${ev.score} · passed=${ev.passed} → ${ev.decision === 'output' ? '输出' : '继续迭代'}`
    case 'final':
      return `最终得分 ${ev.final_score} · ${ev.total_iterations}轮 · ${ev.word_count} words · ${ev.passed ? '达标' : '强制输出'}`
    default:
      return JSON.stringify(ev).slice(0, 100)
  }
}

/** Strip large fields for JSON display */
function stripPreview(ev: SopAgentTraceEvent): Record<string, unknown> {
  const copy = { ...ev }
  // Keep full_content but truncate if very long for readability
  if (typeof copy.full_content === 'string' && (copy.full_content as string).length > 2000) {
    copy.full_content = (copy.full_content as string).slice(0, 2000) + '\n... [truncated]'
  }
  return copy
}

const toolBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '7px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb',
  background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#374151',
}
