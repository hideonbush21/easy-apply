import { useEffect, useState } from 'react'
import { getApplications, updateApplication, deleteApplication } from '@/api/applications'
import type { Application } from '@/types'
import { Trash2, ChevronDown } from 'lucide-react'

const STATUSES = ['待申请', '申请中', '已提交', '面试中', '录取', '拒绝', '等待中', '撤销']
const STATUS_COLORS: Record<string, string> = {
  '待申请': 'bg-gray-100 text-gray-700',
  '申请中': 'bg-blue-100 text-blue-700',
  '已提交': 'bg-indigo-100 text-indigo-700',
  '面试中': 'bg-yellow-100 text-yellow-700',
  '录取': 'bg-green-100 text-green-700',
  '拒绝': 'bg-red-100 text-red-700',
  '等待中': 'bg-orange-100 text-orange-700',
  '撤销': 'bg-gray-100 text-gray-500',
}
const PRIORITY_COLORS: Record<string, string> = {
  '冲刺': 'text-red-600',
  '匹配': 'text-blue-600',
  '保底': 'text-green-600',
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

  if (loading) return <div className="p-8 text-gray-400">加载中...</div>

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">申请管理</h2>
          <p className="text-gray-500 text-sm mt-1">共 {apps.length} 个申请</p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {apps.length === 0 ? '暂无申请，前往学校库添加' : '没有符合筛选条件的申请'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">学校</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">专业</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">优先级</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">截止日期</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{app.school?.name_cn || app.school?.name}</p>
                    <p className="text-xs text-gray-400">{app.school?.country} · #{app.school?.ranking}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{app.major || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium text-sm ${PRIORITY_COLORS[app.priority || ''] || 'text-gray-500'}`}>
                      {app.priority || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{app.application_deadline || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className={`pl-2.5 pr-7 py-1 rounded-full text-xs font-medium border-0 cursor-pointer appearance-none ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
