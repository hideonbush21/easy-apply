import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import { Users, FileText, School, TrendingUp } from 'lucide-react'

interface Stats {
  total_users: number
  total_applications: number
  total_schools: number
  application_status_distribution: Record<string, number>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: '注册用户', value: stats.total_users, icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: '总申请数', value: stats.total_applications, icon: FileText, color: 'bg-purple-50 text-purple-700' },
    { label: '学校数量', value: stats.total_schools, icon: School, color: 'bg-amber-50 text-amber-700' },
  ] : []

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">管理后台</h2>
          <p className="text-gray-500 text-sm mt-1">平台数据概览</p>
        </div>
        <Link
          to="/admin/users"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          用户管理
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stats && Object.keys(stats.application_status_distribution).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} /> 申请状态分布
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.application_status_distribution).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500 mt-1">{status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
