import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import type { Application } from '@/types'

interface Props {
  applications: Application[]
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const STATUS_COLOR: Record<string, string> = {
  applying:   '#f59e0b',
  submitted:  '#0ea5e9',
  accepted:   '#10b981',
  rejected:   '#ef4444',
  withdrawn:  '#9ca3af',
  waitlisted: '#8b5cf6',
}

const STATUS_LABEL: Record<string, string> = {
  applying:   '申请中',
  submitted:  '已提交',
  accepted:   '已录取',
  rejected:   '已拒绝',
  withdrawn:  '已撤回',
  waitlisted: '候补',
}

export default function ApplicationCalendar({ applications }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Map: "YYYY-MM-DD" -> Application[]
  const deadlineMap = useMemo(() => {
    const map: Record<string, Application[]> = {}
    for (const app of applications) {
      if (!app.application_deadline) continue
      const d = app.application_deadline.slice(0, 10)
      if (!map[d]) map[d] = []
      map[d].push(app)
    }
    return map
  }, [applications])

  const goMonth = (delta: number) => {
    setSelectedDay(null)
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const toKey = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const selectedApps = selectedDay ? (deadlineMap[toKey(selectedDay)] ?? []) : []

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={16} style={{ color: '#1dd3b0' }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            申请日历
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => goMonth(-1)} style={{ border: 'none', background: '#f9fafb', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', minWidth: 80, textAlign: 'center' }}>
            {year} 年 {MONTHS[month]}
          </span>
          <button onClick={() => goMonth(1)} style={{ border: 'none', background: '#f9fafb', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9ca3af', padding: '4px 0' }}>{w}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const key = toKey(day)
          const apps = deadlineMap[key] ?? []
          const hasDeadline = apps.length > 0
          const isSelected = selectedDay === day
          const _isToday = isToday(day)

          return (
            <div
              key={key}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              style={{
                borderRadius: 8,
                padding: '6px 0 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                cursor: hasDeadline ? 'pointer' : 'default',
                background: isSelected ? '#e6faf6' : _isToday ? '#f0fdf4' : 'transparent',
                border: isSelected ? '1.5px solid #1dd3b0' : _isToday ? '1.5px solid #bbf7d0' : '1.5px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (hasDeadline && !isSelected) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
              onMouseLeave={e => { if (hasDeadline && !isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: _isToday || isSelected ? 700 : 400,
                color: isSelected ? '#0d9e72' : _isToday ? '#059669' : '#374151',
                lineHeight: 1,
              }}>
                {day}
              </span>
              {/* Deadline dots (up to 3) */}
              <div style={{ display: 'flex', gap: 2, minHeight: 6 }}>
                {apps.slice(0, 3).map((app, i) => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: STATUS_COLOR[app.status] ?? '#9ca3af',
                    flexShrink: 0,
                  }} />
                ))}
                {apps.length > 3 && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
            {month + 1} 月 {selectedDay} 日 · {selectedApps.length} 个截止申请
          </p>
          {selectedApps.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9ca3af' }}>该日无截止申请</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedApps.map(app => (
                <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[app.status] ?? '#9ca3af', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.school_name_cn || app.school_name || app.school?.name_cn || app.school?.name || '未知学校'}
                    </p>
                    {app.major && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{app.major}</p>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: STATUS_COLOR[app.status] ?? '#9ca3af', flexShrink: 0 }}>
                    {STATUS_LABEL[app.status] ?? app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[k] }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
