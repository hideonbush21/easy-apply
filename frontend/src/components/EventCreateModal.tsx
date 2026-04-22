import { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'
import type { Application, EventCategory, CreateEventPayload } from '@/types'
import { getApplications } from '@/api/applications'
import { createEvent } from '@/api/events'

interface Props {
  initialDate?: string          // YYYY-MM-DD，点击日历格时预填
  onClose: () => void
  onCreated: () => void
}

// 申请相关的类型 —— 需要关联 Application
const APP_LINKED_CATEGORIES: EventCategory[] = ['interview', 'submission', 'decision', 'milestone']

// category → 建议触发的状态变更
const CATEGORY_STATUS_MAP: Partial<Record<EventCategory, string>> = {
  submission: '已提交',
  interview:  '面试邀请',
  decision:   '已录取',
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  deadline:   '截止日期',
  exam:       '考试',
  interview:  '面试',
  milestone:  '里程碑',
  reminder:   '提醒',
  submission: '申请提交',
  decision:   '录取结果',
  task:       '待办',
  custom:     '自定义',
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
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

const VALID_STATUSES = ['待申请', '材料准备中', '已提交', '面试邀请', '面试完成', '等待结果', '已录取', '已拒绝', '候补名单']

export default function EventCreateModal({ initialDate, onClose, onCreated }: Props) {
  const [form, setForm] = useState<{
    title: string
    is_all_day: boolean
    start_date: string
    start_time: string
    end_date: string
    end_time: string
    category: EventCategory
    application_id: string
    status_change_to: string
    user_notes: string
  }>({
    title: '',
    is_all_day: false,
    start_date: initialDate ?? '',
    start_time: '',
    end_date: '',
    end_time: '',
    category: 'custom',
    application_id: '',
    status_change_to: '',
    user_notes: '',
  })

  const [applications, setApplications] = useState<Application[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dupWarning, setDupWarning] = useState<{ message: string; current_status: string } | null>(null)
  const [confirmStatusChange, setConfirmStatusChange] = useState(false)

  useEffect(() => {
    getApplications().then(r => setApplications(r.data)).catch(() => null)
  }, [])

  // 当 category 改变时，自动填充建议状态
  useEffect(() => {
    const suggested = CATEGORY_STATUS_MAP[form.category]
    setForm(f => ({ ...f, status_change_to: suggested ?? '' }))
    setConfirmStatusChange(false)
    setDupWarning(null)
  }, [form.category])

  const isAppLinked = APP_LINKED_CATEGORIES.includes(form.category)
  const selectedApp = applications.find(a => a.id === form.application_id)
  const willChangeStatus = isAppLinked && form.application_id && form.status_change_to

  const handleSubmit = async (force = false) => {
    setError('')
    if (!form.title.trim()) { setError('请填写事件名称'); return }
    if (!form.start_date) { setError('请选择日期'); return }

    // 需要关联 App 但未选
    if (isAppLinked && !form.application_id) {
      setError('该类型事件需要关联一个申请'); return
    }

    // 状态变更需要用户确认
    if (willChangeStatus && !confirmStatusChange && !force) {
      setConfirmStatusChange(true); return
    }

    setSaving(true)
    try {
      const payload: CreateEventPayload = {
        title: form.title.trim(),
        is_all_day: form.is_all_day,
        start_date: form.start_date,
        start_time: form.is_all_day ? undefined : form.start_time || undefined,
        end_date: form.end_date || undefined,
        end_time: form.is_all_day ? undefined : form.end_time || undefined,
        category: form.category,
        application_id: form.application_id || undefined,
        status_change_to: willChangeStatus ? form.status_change_to : undefined,
        user_notes: form.user_notes,
      }
      await createEvent(payload)
      onCreated()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; message?: string; current_status?: string } } }
      if (err.response?.data?.error === 'duplicate_status') {
        setDupWarning({
          message: err.response.data.message ?? '状态重复',
          current_status: err.response.data.current_status ?? '',
        })
      } else {
        setError(err.response?.data?.message ?? '创建失败，请重试')
      }
    } finally {
      setSaving(false)
      setConfirmStatusChange(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: 480, maxHeight: '90vh', overflowY: 'auto', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: '#f3f4f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} color="#6b7280" />
        </button>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 24 }}>新建事件</h3>

        {/* 状态变更确认界面 */}
        {confirmStatusChange && selectedApp && willChangeStatus ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#f59e0b" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>确认触发状态变更？</p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              将把「{selectedApp.school_name_cn || selectedApp.school_name}」
              <br />的申请状态从 <strong>"{selectedApp.status}"</strong> 更改为 <strong>"{form.status_change_to}"</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmStatusChange(false)}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}
              >
                取消
              </button>
              <button
                onClick={() => { setConfirmStatusChange(false); handleSubmit(true) }}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#1dd3b0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}
              >
                确认，创建事件并更新状态
              </button>
            </div>
          </div>
        ) : dupWarning ? (
          /* 防重复警告界面 */
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>检测到状态冲突</p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>{dupWarning.message}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={onClose}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setDupWarning(null)
                  setForm(f => ({ ...f, status_change_to: '' }))
                }}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#0ea5e9', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}
              >
                仅创建提醒（不更新状态）
              </button>
            </div>
          </div>
        ) : (
          /* 正常创建表单 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 标题 */}
            <div>
              <label style={labelStyle}>事件名称</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="例：雅思考试、MIT 面试"
                style={inputStyle}
              />
            </div>

            {/* 类型 */}
            <div>
              <label style={labelStyle}>事件类型</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat, application_id: '' }))}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 10,
                      border: `2px solid ${form.category === cat ? CATEGORY_COLORS[cat] : '#e5e7eb'}`,
                      background: form.category === cat ? `${CATEGORY_COLORS[cat]}15` : '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: form.category === cat ? CATEGORY_COLORS[cat] : '#6b7280',
                      transition: 'all 0.15s',
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* 全天开关 + 日期 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={labelStyle}>日期 / 时间</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>
                  <input
                    type="checkbox"
                    checked={form.is_all_day}
                    onChange={e => setForm(f => ({ ...f, is_all_day: e.target.checked }))}
                    style={{ accentColor: '#1dd3b0' }}
                  />
                  全天事件
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: form.is_all_day ? '1fr' : '1fr 1fr', gap: 8 }}>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  style={inputStyle}
                />
                {!form.is_all_day && (
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    style={inputStyle}
                    placeholder="开始时间"
                  />
                )}
                {!form.is_all_day && (
                  <>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                      style={inputStyle}
                      placeholder="结束日期（可选）"
                    />
                    <input
                      type="time"
                      value={form.end_time}
                      onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      style={inputStyle}
                      placeholder="结束时间（可选）"
                    />
                  </>
                )}
              </div>
            </div>

            {/* 关联申请（仅申请相关类型显示） */}
            {isAppLinked && (
              <div>
                <label style={labelStyle}>关联申请 <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  value={form.application_id}
                  onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  <option value="">请选择申请项目</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.school_name_cn || app.school_name} · {app.major || app.program_name_cn} ({app.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 状态变更建议 */}
            {isAppLinked && form.application_id && (
              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 14px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>关联状态变更</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={form.status_change_to}
                    onChange={e => setForm(f => ({ ...f, status_change_to: e.target.value }))}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12, background: '#fff' }}
                  >
                    <option value="">不更新状态</option>
                    {VALID_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
                  创建此事件时会同步更新申请状态（需二次确认）
                </p>
              </div>
            )}

            {/* 备注 */}
            <div>
              <label style={labelStyle}>备注（可选）</label>
              <textarea
                value={form.user_notes}
                onChange={e => setForm(f => ({ ...f, user_notes: e.target.value }))}
                rows={2}
                placeholder="添加备注..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <p style={{ fontSize: 12, color: '#ef4444', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                {error}
              </p>
            )}

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151' }}
              >
                取消
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={saving}
                style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: saving ? '#9ca3af' : '#1dd3b0', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, color: '#fff' }}
              >
                {saving ? '创建中...' : '创建事件'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  border: '1.5px solid #e5e7eb',
  fontSize: 13,
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
}
