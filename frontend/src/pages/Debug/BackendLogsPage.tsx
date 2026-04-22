import { useState, useEffect, useCallback, useRef } from 'react'
import { getDebugLogs, clearDebugLogs } from '@/api/debug'
import type { DebugLogEntry } from '@/api/debug'
import { Terminal, RefreshCw, Trash2, Pause, Play, Search } from 'lucide-react'

const LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const
const LEVEL_COLOR: Record<string, { bg: string; fg: string }> = {
  DEBUG:    { bg: '#f3f4f6', fg: '#6b7280' },
  INFO:     { bg: '#eff6ff', fg: '#2563eb' },
  WARNING:  { bg: '#fefce8', fg: '#d97706' },
  ERROR:    { bg: '#fef2f2', fg: '#dc2626' },
  CRITICAL: { bg: '#fef2f2', fg: '#991b1b' },
}

export default function BackendLogsPage() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set())
  const [searchText, setSearchText] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchLogs = useCallback(() => {
    setLoading(true)
    const params: Record<string, string | number> = { limit: 300 }
    if (selectedLevels.size > 0) params.level = [...selectedLevels].join(',')
    if (searchText.trim()) params.search = searchText.trim()
    getDebugLogs(params)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total_buffered); setError('') })
      .catch(e => setError(e.response?.data?.error || '获取日志失败'))
      .finally(() => setLoading(false))
  }, [selectedLevels, searchText])

  // 首次加载
  useEffect(() => { fetchLogs() }, [fetchLogs])

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 5000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchLogs])

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => {
      const next = new Set(prev)
      next.has(level) ? next.delete(level) : next.add(level)
      return next
    })
  }

  const handleClear = async () => {
    if (!window.confirm('确认清空所有缓冲日志？')) return
    await clearDebugLogs()
    fetchLogs()
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e293b, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={18} color="#22d3ee" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>后端日志</h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              缓冲区 {total} 条 · {autoRefresh ? '自动刷新中 (5s)' : '已暂停'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setAutoRefresh(v => !v)} style={toolBtnStyle}>
            {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
            {autoRefresh ? '暂停' : '恢复'}
          </button>
          <button onClick={fetchLogs} disabled={loading} style={toolBtnStyle}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            刷新
          </button>
          <button onClick={handleClear} style={{ ...toolBtnStyle, color: '#ef4444', borderColor: '#fecaca' }}>
            <Trash2 size={14} />
            清空
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Level chips */}
        <div style={{ display: 'flex', gap: 4 }}>
          {LEVELS.map(level => {
            const active = selectedLevels.size === 0 || selectedLevels.has(level)
            const c = LEVEL_COLOR[level]
            return (
              <button key={level} onClick={() => toggleLevel(level)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1.5px solid ${active ? c.fg : '#e5e7eb'}`,
                  background: active ? c.bg : '#fff',
                  color: active ? c.fg : '#9ca3af',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {level}
              </button>
            )
          })}
        </div>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#9ca3af' }} />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索日志内容/logger…"
            style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13, marginBottom: 8, flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Log list */}
      <div style={{
        flex: 1, overflow: 'auto', borderRadius: 12, border: '1.5px solid #e5e7eb',
        background: '#0f172a', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      }}>
        {logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            {loading ? '加载中...' : '暂无日志'}
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {logs.map((log, i) => {
              const c = LEVEL_COLOR[log.level] ?? LEVEL_COLOR.DEBUG
              const isExpanded = expandedIdx === i
              return (
                <div key={i}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  style={{
                    padding: '4px 14px', cursor: 'pointer',
                    background: isExpanded ? '#1e293b' : 'transparent',
                    borderBottom: '1px solid #1e293b',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.6 }}>
                    {/* Timestamp */}
                    <span style={{ color: '#475569', flexShrink: 0, fontSize: 11 }}>
                      {formatTime(log.timestamp)}
                    </span>
                    {/* Level badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: c.fg, color: '#fff', flexShrink: 0, minWidth: 48, textAlign: 'center',
                    }}>
                      {log.level}
                    </span>
                    {/* Logger name */}
                    <span style={{ color: '#22d3ee', flexShrink: 0, fontSize: 11 }}>
                      [{log.logger}]
                    </span>
                    {/* Message */}
                    <span style={{
                      color: log.level === 'ERROR' || log.level === 'CRITICAL' ? '#fca5a5' : '#e2e8f0',
                      flex: 1, overflow: isExpanded ? 'visible' : 'hidden',
                      textOverflow: isExpanded ? 'unset' : 'ellipsis',
                      whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
                      wordBreak: isExpanded ? 'break-all' : 'normal',
                    }}>
                      {log.message}
                    </span>
                  </div>
                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginTop: 4, paddingLeft: 92, fontSize: 11, color: '#64748b' }}>
                      {log.file}:{log.line}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
  } catch {
    return iso
  }
}

const toolBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '7px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb',
  background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#374151',
}
