import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getApplications, updateApplication, deleteApplication } from '@/api/applications'
import type { Application } from '@/types'
import { Trash2, ChevronDown, FileText, BookOpen, ExternalLink } from 'lucide-react'
import { Table } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Input'

// Synced with backend VALID_STATUSES
const STATUSES = ['待申请', '材料准备中', '已提交', '面试邀请', '面试完成', '等待结果', '已录取', '已拒绝', '候补名单']

// Light-theme status colors (bypasses dark-mode Badge component)
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  '待申请':    { bg: '#f3f4f6', color: '#6b7280',  border: '#e5e7eb' },
  '材料准备中': { bg: '#ede9fe', color: '#7c3aed',  border: '#ddd6fe' },
  '已提交':    { bg: '#e0e7ff', color: '#4338ca',  border: '#c7d2fe' },
  '面试邀请':  { bg: '#fef3c7', color: '#b45309',  border: '#fde68a' },
  '面试完成':  { bg: '#fef3c7', color: '#92400e',  border: '#fde68a' },
  '等待结果':  { bg: '#fff7ed', color: '#c2410c',  border: '#fed7aa' },
  '已录取':    { bg: '#d1fae5', color: '#065f46',  border: '#a7f3d0' },
  '已拒绝':    { bg: '#fee2e2', color: '#991b1b',  border: '#fecaca' },
  '候补名单':  { bg: '#e0f2fe', color: '#0369a1',  border: '#bae6fd' },
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  '冲刺': { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  '匹配': { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  '保底': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
}

// Shared center-aligned cell class
const CENTER = 'text-center'

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
              {/* left-aligned text columns */}
              <Table.Head>申请项目</Table.Head>
              <Table.Head>项目详情</Table.Head>
              {/* centered columns */}
              <Table.Head className={`w-20 ${CENTER}`}>优先级</Table.Head>
              <Table.Head className={`w-40 ${CENTER}`}>截止日期</Table.Head>
              <Table.Head className={`w-40 ${CENTER}`}>状态</Table.Head>
              <Table.Head className={`w-16 ${CENTER}`}>操作</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.map(app => {
              const schoolName = app.school_name_cn || app.school_name || app.school?.name_cn || app.school?.name
              const programNameCn = app.program_name_cn || app.major
              const programNameEn = app.program_name_en
              const ranking = app.school_ranking
              const department = app.department
              const duration = app.duration
              const tuitionCny = app.tuition_cny
              const programUrl = app.program_url
              const ieltsReq = app.ielts_requirement as { min?: number } | null
              const toeflReq = app.toefl_requirement as { min?: number } | null
              const statusStyle = STATUS_STYLE[app.status] || STATUS_STYLE['待申请']
              const priorityStyle = app.priority ? PRIORITY_STYLE[app.priority] : null

              return (
                <Table.Row key={app.id}>

                  {/* 申请项目 */}
                  <Table.Cell>
                    <div>
                      {/* 学校名 + 排名 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: '#111827' }}>
                          {schoolName || '—'}
                        </span>
                        {ranking && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                                style={{ background: '#f3f4f6', color: '#6b7280' }}>
                            # {ranking}
                          </span>
                        )}
                      </div>
                      {/* 项目中文名 */}
                      {programNameCn && (
                        <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>{programNameCn}</p>
                      )}
                      {/* 项目英文名（仅有中文时补充显示） */}
                      {programNameEn && programNameCn && programNameEn !== programNameCn && (
                        <p className="text-[11px] mt-0.5 leading-tight" style={{ color: '#9ca3af' }}>{programNameEn}</p>
                      )}
                      {/* 学院 */}
                      {department && (
                        <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>
                          <span style={{ color: '#9ca3af' }}>学院 · </span>{department}
                        </p>
                      )}
                    </div>
                  </Table.Cell>

                  {/* 项目详情：学制 / 学费 / 语言 / 链接 — 水平 chips */}
                  <Table.Cell>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {duration && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md"
                              style={{ background: '#f3f4f6', color: '#374151' }}>
                          {duration}
                        </span>
                      )}
                      {tuitionCny && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md"
                              style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a' }}>
                          ¥{tuitionCny.toLocaleString()}
                        </span>
                      )}
                      {ieltsReq?.min && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md"
                              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          雅思 {ieltsReq.min}+
                        </span>
                      )}
                      {toeflReq?.min && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md"
                              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          托福 {toeflReq.min}+
                        </span>
                      )}
                      {programUrl && (
                        <a href={programUrl} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-md transition-colors"
                           style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                          <ExternalLink size={10} />
                          官网
                        </a>
                      )}
                      {!duration && !tuitionCny && !ieltsReq?.min && !toeflReq?.min && !programUrl && (
                        <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                    </div>
                  </Table.Cell>

                  {/* 优先级 */}
                  <Table.Cell className={CENTER}>
                    {priorityStyle ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                            style={{ background: priorityStyle.bg, color: priorityStyle.color, border: `1px solid ${priorityStyle.border}` }}>
                        {app.priority}
                      </span>
                    ) : (
                      <span style={{ color: '#d1d5db' }}>—</span>
                    )}
                  </Table.Cell>

                  {/* 截止日期 */}
                  <Table.Cell className={`${CENTER} whitespace-nowrap`}>
                    {app.application_deadline ? (
                      <span className="tabular-nums text-xs font-medium" style={{ color: '#374151' }}>
                        {app.application_deadline}
                      </span>
                    ) : (
                      <span style={{ color: '#d1d5db' }}>—</span>
                    )}
                  </Table.Cell>

                  {/* 状态下拉 — 完全自定义 light-theme pill */}
                  <Table.Cell className={CENTER}>
                    <div className="relative inline-flex justify-center">
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                        }}
                      >
                        {app.status}
                        <ChevronDown size={10} className="opacity-60 shrink-0" />
                      </span>
                    </div>
                  </Table.Cell>

                  {/* 操作 */}
                  <Table.Cell className={CENTER}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate('/dashboard/documents', { state: { application: app } })}
                        title="文书管理"
                        style={{ color: '#9ca3af' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                      >
                        <BookOpen size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
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
