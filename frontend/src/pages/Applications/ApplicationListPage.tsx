import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getApplications, updateApplication, deleteApplication } from '@/api/applications'
import type { Application } from '@/types'
import { Trash2, ChevronDown, FileText, BookOpen, ExternalLink, MapPin, Clock, GraduationCap } from 'lucide-react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Input'

// Synced with backend VALID_STATUSES
const STATUSES = ['待申请', '材料准备中', '已提交', '面试邀请', '面试完成', '等待结果', '已录取', '已拒绝', '候补名单']

type BadgeVariant = 'default' | 'primary' | 'indigo' | 'warning' | 'success' | 'danger' | 'orange' | 'accent'

const STATUS_BADGE: Record<string, BadgeVariant> = {
  '待申请':   'default',
  '材料准备中': 'primary',
  '已提交':   'indigo',
  '面试邀请': 'warning',
  '面试完成': 'warning',
  '等待结果': 'orange',
  '已录取':   'success',
  '已拒绝':   'danger',
  '候补名单': 'accent',
}

const PRIORITY_CLS: Record<string, string> = {
  '冲刺': 'text-rose-500 font-semibold',
  '匹配': 'text-violet-500 font-semibold',
  '保底': 'text-emerald-500 font-semibold',
}

const PRIORITY_BG: Record<string, string> = {
  '冲刺': 'bg-rose-50 text-rose-600 border border-rose-100',
  '匹配': 'bg-violet-50 text-violet-600 border border-violet-100',
  '保底': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
}

export default function ApplicationListPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getApplications()
      .then(r => setApps(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateApplication(id, { status })
    setApps(prev => prev.map(a => a.id === id ? res.data : a))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此申请?')) return
    await deleteApplication(id)
    setApps(prev => prev.filter(a => a.id !== id))
  }

  const filtered = filterStatus ? apps.filter(a => a.status === filterStatus) : apps

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-2" style={{ color: '#6b7280' }}>
      <Spinner /> <span className="text-sm">加载中...</span>
    </div>
  )

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#0a0a0a', fontFamily: 'var(--font-display)' }}>申请管理</h2>
          <p className="text-sm mt-1 tabular-nums" style={{ color: '#6b7280' }}>共 {apps.length} 个申请</p>
        </div>
        <Select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-36"
        >
          <option value="">全部状态</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={20} />}
          title={apps.length === 0 ? '暂无申请' : '没有符合筛选条件的申请'}
          description={apps.length === 0 ? '通过智能推荐功能添加心仪项目' : undefined}
          action={apps.length === 0 ? (
            <Link to="/dashboard/schools/recommendations" className="text-sm font-medium transition-colors"
                  style={{ color: '#8b5cf6' }}>
              前往智能推荐 →
            </Link>
          ) : undefined}
        />
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>学校 / 项目</Table.Head>
              <Table.Head>学院 / 专业详情</Table.Head>
              <Table.Head className="w-20">优先级</Table.Head>
              <Table.Head className="w-28">截止日期</Table.Head>
              <Table.Head className="w-36">状态</Table.Head>
              <Table.Head className="w-20">操作</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.map(app => {
              const schoolName = app.school_name_cn || app.school_name || app.school?.name_cn || app.school?.name
              const programName = app.program_name_cn || app.program_name_en || app.major
              const ranking = app.school_ranking
              const department = app.department
              const duration = app.duration
              const tuitionCny = app.tuition_cny
              const programUrl = app.program_url
              const ieltsReq = app.ielts_requirement as { min?: number } | null
              const toeflReq = app.toefl_requirement as { min?: number } | null

              return (
                <Table.Row key={app.id}>
                  {/* 学校 / 项目 */}
                  <Table.Cell>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm" style={{ color: '#111827' }}>
                          {schoolName || '-'}
                        </p>
                        {ranking && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                                style={{ background: '#f3f4f6', color: '#6b7280' }}>
                            #{ranking}
                          </span>
                        )}
                      </div>
                      {programName && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <GraduationCap size={11} style={{ color: '#9ca3af', flexShrink: 0 }} />
                          <p className="text-xs" style={{ color: '#374151' }}>{programName}</p>
                        </div>
                      )}
                      {app.program_name_en && app.program_name_cn && (
                        <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>{app.program_name_en}</p>
                      )}
                    </div>
                  </Table.Cell>

                  {/* 学院 / 专业详情 */}
                  <Table.Cell>
                    <div className="space-y-0.5 text-xs">
                      {department && (
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#6b7280' }}>学院：</span>
                          <span style={{ color: '#374151' }}>{department}</span>
                        </div>
                      )}
                      {duration && (
                        <div className="flex items-center gap-1">
                          <Clock size={10} style={{ color: '#9ca3af' }} />
                          <span style={{ color: '#6b7280' }}>{duration}</span>
                        </div>
                      )}
                      {tuitionCny && (
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#6b7280' }}>学费：</span>
                          <span style={{ color: '#374151' }}>¥{tuitionCny.toLocaleString()}</span>
                        </div>
                      )}
                      {(ieltsReq?.min || toeflReq?.min) && (
                        <div className="flex items-center gap-2">
                          {ieltsReq?.min && (
                            <span style={{ color: '#6b7280' }}>雅思 {ieltsReq.min}+</span>
                          )}
                          {toeflReq?.min && (
                            <span style={{ color: '#6b7280' }}>托福 {toeflReq.min}+</span>
                          )}
                        </div>
                      )}
                      {!department && !duration && !tuitionCny && !ieltsReq?.min && !toeflReq?.min && (
                        <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                      {programUrl && (
                        <a href={programUrl} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-0.5 mt-0.5 transition-colors"
                           style={{ color: '#8b5cf6' }}>
                          <ExternalLink size={10} />
                          <span>项目官网</span>
                        </a>
                      )}
                    </div>
                  </Table.Cell>

                  {/* 优先级 */}
                  <Table.Cell>
                    {app.priority ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BG[app.priority] || ''}`}>
                        {app.priority}
                      </span>
                    ) : (
                      <span style={{ color: '#d1d5db' }}>—</span>
                    )}
                  </Table.Cell>

                  {/* 截止日期 */}
                  <Table.Cell>
                    {app.application_deadline ? (
                      <div className="flex items-center gap-1">
                        <MapPin size={11} style={{ color: '#9ca3af' }} />
                        <span className="tabular-nums text-xs" style={{ color: '#374151' }}>
                          {app.application_deadline}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: '#d1d5db' }}>—</span>
                    )}
                  </Table.Cell>

                  {/* 状态 */}
                  <Table.Cell>
                    <div className="relative inline-block">
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <Badge
                        variant={STATUS_BADGE[app.status] || 'default'}
                        className="flex items-center gap-1 pr-1.5 pointer-events-none"
                      >
                        {app.status}
                        <ChevronDown size={10} className="opacity-60 shrink-0" />
                      </Badge>
                    </div>
                  </Table.Cell>

                  {/* 操作 */}
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/dashboard/documents', { state: { application: app } })}
                        className="transition-colors"
                        title="文书管理"
                        style={{ color: '#9ca3af' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                      >
                        <BookOpen size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="transition-colors"
                        title="删除"
                        style={{ color: '#9ca3af' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
