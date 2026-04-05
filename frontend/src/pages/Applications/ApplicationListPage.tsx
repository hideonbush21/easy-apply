import { useEffect, useState } from 'react'
import { getApplications, updateApplication, deleteApplication } from '@/api/applications'
import type { Application } from '@/types'
import { Trash2, ChevronDown, FileText } from 'lucide-react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Input'
import type { VariantProps } from 'class-variance-authority'

const STATUSES = ['待申请', '申请中', '已提交', '面试中', '录取', '拒绝', '等待中', '撤销']

type BadgeVariant = 'default' | 'primary' | 'indigo' | 'warning' | 'success' | 'danger' | 'orange' | 'accent'

const STATUS_BADGE: Record<string, BadgeVariant> = {
  '待申请': 'default',
  '申请中': 'primary',
  '已提交': 'indigo',
  '面试中': 'warning',
  '录取':   'success',
  '拒绝':   'danger',
  '等待中': 'orange',
  '撤销':   'default',
}

const PRIORITY_CLS: Record<string, string> = {
  '冲刺': 'text-danger-600 font-semibold',
  '匹配': 'text-primary-600 font-semibold',
  '保底': 'text-success-600 font-semibold',
}

export default function ApplicationListPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

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
    <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
      <Spinner /> <span className="text-sm">加载中...</span>
    </div>
  )

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">申请管理</h2>
          <p className="text-slate-500 text-sm mt-1 tabular-nums">共 {apps.length} 个申请</p>
        </div>
        <Select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-32"
        >
          <option value="">全部状态</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={20} />}
          title={apps.length === 0 ? '暂无申请' : '没有符合筛选条件的申请'}
          description={apps.length === 0 ? '前往学校库浏览并添加申请' : undefined}
        />
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>学校</Table.Head>
              <Table.Head className="w-36">专业</Table.Head>
              <Table.Head className="w-20">优先级</Table.Head>
              <Table.Head className="w-28">截止日期</Table.Head>
              <Table.Head className="w-32">状态</Table.Head>
              <Table.Head className="w-12"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.map(app => (
              <Table.Row key={app.id}>
                <Table.Cell>
                  <p className="font-medium text-slate-900">{app.school?.name_cn || app.school?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{app.school?.country} · #{app.school?.ranking}</p>
                </Table.Cell>
                <Table.Cell className="text-slate-600">{app.major || '-'}</Table.Cell>
                <Table.Cell>
                  <span className={`text-sm ${PRIORITY_CLS[app.priority || ''] || 'text-slate-400'}`}>
                    {app.priority || '-'}
                  </span>
                </Table.Cell>
                <Table.Cell className="text-slate-600 tabular-nums">{app.application_deadline || '-'}</Table.Cell>
                <Table.Cell>
                  <div className="relative inline-block">
                    <select
                      value={app.status}
                      onChange={e => handleStatusChange(app.id, e.target.value)}
                      className="pl-2.5 pr-7 py-1 rounded-full text-xs font-medium border-0 cursor-pointer appearance-none focus:outline-none"
                      style={{ background: 'transparent' }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Badge
                      variant={STATUS_BADGE[app.status] || 'default'}
                      className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    >
                      {app.status}
                    </Badge>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="text-slate-300 hover:text-danger-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
