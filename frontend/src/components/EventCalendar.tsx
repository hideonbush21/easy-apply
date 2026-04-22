import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Check } from 'lucide-react'
import type { Application, CalendarEvent, EventCategory } from '@/types'
import { getEvents, deleteEvent, completeEvent } from '@/api/events'
import EventCreateModal from './EventCreateModal'

interface Props {
  applications: Application[]
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const CATEGORY_COLOR: Record<EventCategory, string> = {
  deadline:   '#ef4444',
  exam:       '#f59e0b',
  interview:  '#f97316',
  milestone:  '#10b981',
  reminder:   '#8b5cf6',
  submission: '#0ea5e9',
  decision:   '#1dd3b0',
  task:       '#6b7280',
  custom:     '#9ca3af',
}

const CATEGORY_LABEL: Record<EventCategory, string> = {
  deadline:   '截止',
  exam:       '考试',
  interview:  '面试',
  milestone:  '里程碑',
  reminder:   '提醒',
  submission: '提交',
  decision:   '录取结果',
  task:       '待办',
  custom:     '自定义',
}

export default function EventCalendar({ applications }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())  // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [createDate, setCreateDate] = useState<string | undefined>()
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null)

  const fetchEvents = useCallback(() => {
    getEvents(year, month + 1).then(r => setEvents(r.data)).catch(() => null)
  }, [year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // 申请截止日期 → 映射为虚拟 deadline event（不存储到后端，仅展示）
  const deadlineEventMap = useMemo(() => {
    const map: Record<string, Application[]> = {}
    for (const app of applications) {
      if (!app.application_deadline) continue
      const d = app.application_deadline.slice(0, 10)
      if (!map[d]) map[d] = []
      map[d].push(app)
    }
    return map
  }, [applications])

  // Event 按日期分组
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      const d = ev.start_date
      if (!map[d]) map[d] = []
      map[d].push(ev)
    }
    return map
  }, [events])

  const goMonth = (delta: number) => {
    setSelectedDay(null)
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const toKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const handleDayClick = (day: number) => {
    setSelectedDay(prev => (prev === day ? null : day))
  }

  const handleDayDoubleClick = (day: number) => {
    setCreateDate(toKey(day))
    setShowCreate(true)
  }

  const selectedKey = selectedDay ? toKey(selectedDay) : ''
  const selectedEvents = selectedKey ? (eventMap[selectedKey] ?? []) : []
  const selectedDeadlines = selectedKey ? (deadlineEventMap[selectedKey] ?? []) : []

  const handleComplete = async (ev: CalendarEvent) => {
    await completeEvent(ev.id, !ev.manual_completed)
    fetchEvents()
  }

  const handleDelete = async (ev: CalendarEvent) => {
    if (!window.confirm(`确认删除「${ev.title}」？`)) return
    await deleteEvent(ev.id)
    fetchEvents()
    if (selectedEvents.length <= 1) setSelectedDay(null)
  }

  return (
    <>
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
            <button onClick={() => goMonth(-1)} style={navBtnStyle}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', minWidth: 80, textAlign: 'center' }}>
              {year} 年 {MONTHS[month]}
            </span>
            <button onClick={() => goMonth(1)} style={navBtnStyle}>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => { setCreateDate(undefined); setShowCreate(true) }}
              style={{ border: 'none', background: '#1dd3b0', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              title="新建事件"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Hint */}
        <p style={{ fontSize: 11, color: '#c0c0c0', marginBottom: 8, textAlign: 'right' }}>单击选中 · 双击新建事件</p>

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
            const dayEvents = eventMap[key] ?? []
            const dayDeadlines = deadlineEventMap[key] ?? []
            const isSelected = selectedDay === day
            const _isToday = isToday(day)

            // 合并所有事项（deadline 优先）
            const allItems: { color: string; title: string }[] = [
              ...dayDeadlines.map(app => ({
                color: CATEGORY_COLOR.deadline,
                title: `${app.school_name_cn || app.school_name} 截止`,
              })),
              ...dayEvents.map(ev => ({
                color: ev.color ?? CATEGORY_COLOR[ev.category] ?? '#9ca3af',
                title: ev.title,
              })),
            ]
            const shownItems = allItems.slice(0, 2)
            const overflowCount = allItems.length - shownItems.length

            return (
              <div
                key={key}
                onClick={() => handleDayClick(day)}
                onDoubleClick={() => handleDayDoubleClick(day)}
                style={{
                  borderRadius: 8,
                  padding: '6px 3px 5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  minHeight: 62,
                  background: isSelected ? '#e6faf6' : _isToday ? '#f0fdf4' : 'transparent',
                  border: isSelected ? '1.5px solid #1dd3b0' : _isToday ? '1.5px solid #bbf7d0' : '1.5px solid transparent',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{
                  fontSize: 13,
                  fontWeight: _isToday || isSelected ? 700 : 400,
                  color: isSelected ? '#0d9e72' : _isToday ? '#059669' : '#374151',
                  lineHeight: 1,
                  marginBottom: 2,
                }}>
                  {day}
                </span>
                {shownItems.map((item, i) => (
                  <div key={i} style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    padding: '1px 3px',
                    borderRadius: 3,
                    background: `${item.color}18`,
                    overflow: 'hidden',
                  }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, lineHeight: 1.5 }}>
                      {item.title}
                    </span>
                  </div>
                ))}
                {overflowCount > 0 && (
                  <span style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1, alignSelf: 'flex-start', paddingLeft: 3 }}>
                    +{overflowCount} 项
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                {month + 1} 月 {selectedDay} 日
                {selectedEvents.length + selectedDeadlines.length > 0 && (
                  <span style={{ marginLeft: 6, color: '#9ca3af', fontWeight: 400 }}>
                    · {selectedEvents.length + selectedDeadlines.length} 项事件
                  </span>
                )}
              </p>
              <button
                onClick={() => { setCreateDate(toKey(selectedDay)); setShowCreate(true) }}
                style={{ fontSize: 12, color: '#1dd3b0', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={12} /> 新建
              </button>
            </div>

            {selectedEvents.length === 0 && selectedDeadlines.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>该日暂无事件，双击日期格快速新建</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* 申请截止日期 */}
                {selectedDeadlines.map(app => (
                  <div key={`dl-${app.id}`} style={eventItemStyle('#ef4444')}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                        {app.school_name_cn || app.school_name} · {app.major || app.program_name_cn}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', flexShrink: 0 }}>截止日期</span>
                  </div>
                ))}

                {/* 用户 Events */}
                {selectedEvents.map(ev => (
                  <div
                    key={ev.id}
                    style={{ ...eventItemStyle(ev.color ?? CATEGORY_COLOR[ev.category] ?? '#9ca3af'), opacity: ev.manual_completed ? 0.6 : 1 }}
                    onClick={() => setDetailEvent(ev)}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color ?? CATEGORY_COLOR[ev.category] ?? '#9ca3af', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', textDecoration: ev.manual_completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </p>
                      {ev.start_time && (
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{ev.start_time}</p>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: ev.color ?? CATEGORY_COLOR[ev.category] ?? '#9ca3af', flexShrink: 0 }}>
                      {CATEGORY_LABEL[ev.category]}
                    </span>
                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: 4, marginLeft: 4 }} onClick={e => e.stopPropagation()}>
                      {ev.editable_by_user && (
                        <button
                          onClick={() => handleComplete(ev)}
                          title={ev.manual_completed ? '取消完成' : '标记完成'}
                          style={{ border: 'none', background: ev.manual_completed ? '#d1fae5' : '#f3f4f6', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Check size={12} color={ev.manual_completed ? '#10b981' : '#9ca3af'} />
                        </button>
                      )}
                      {ev.deletable_by_user && (
                        <button
                          onClick={() => handleDelete(ev)}
                          title="删除"
                          style={{ border: 'none', background: '#f3f4f6', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9ca3af' }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(Object.entries(CATEGORY_LABEL) as [EventCategory, string][]).map(([cat, label]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_COLOR[cat] }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 新建 Event 弹窗 */}
      {showCreate && (
        <EventCreateModal
          initialDate={createDate}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchEvents() }}
        />
      )}

      {/* Event 详情弹窗（简版） */}
      {detailEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 380, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: detailEvent.color ?? CATEGORY_COLOR[detailEvent.category], background: `${detailEvent.color ?? CATEGORY_COLOR[detailEvent.category]}15`, padding: '2px 8px', borderRadius: 6 }}>
                  {CATEGORY_LABEL[detailEvent.category]}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginTop: 8 }}>{detailEvent.title}</h3>
              </div>
              <button onClick={() => setDetailEvent(null)} style={{ border: 'none', background: '#f3f4f6', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6b7280' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#374151' }}>
              <p>📅 {detailEvent.start_date}{detailEvent.start_time ? ` ${detailEvent.start_time}` : ''}</p>
              {detailEvent.status_change_to && (
                <p>🔄 触发状态变更：<strong>{detailEvent.status_change_from}</strong> → <strong>{detailEvent.status_change_to}</strong></p>
              )}
              {detailEvent.user_notes && <p>📝 {detailEvent.user_notes}</p>}
              <p style={{ color: '#9ca3af', fontSize: 11 }}>来源：{detailEvent.origin === 'manual' ? '手动创建' : detailEvent.origin === 'email_import' ? '邮件导入' : '机器人'}</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {detailEvent.editable_by_user && (
                <button
                  onClick={() => { handleComplete(detailEvent); setDetailEvent(null) }}
                  style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}
                >
                  {detailEvent.manual_completed ? '取消完成' : '标记完成'}
                </button>
              )}
              {detailEvent.deletable_by_user && (
                <button
                  onClick={() => { handleDelete(detailEvent); setDetailEvent(null) }}
                  style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: '#fef2f2', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#ef4444' }}
                >
                  删除事件
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const navBtnStyle: React.CSSProperties = {
  border: 'none',
  background: '#f9fafb',
  borderRadius: 8,
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#6b7280',
}

function eventItemStyle(accentColor: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 10,
    background: `${accentColor}08`,
    border: `1px solid ${accentColor}20`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }
}
