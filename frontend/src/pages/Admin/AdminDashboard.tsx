import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import { Users, FileText, School, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

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
    { label: '注册用户', value: stats.total_users, icon: Users, color: 'bg-violet-500/10 text-violet-300' },
    { label: '总申请数', value: stats.total_applications, icon: FileText, color: 'bg-sky-500/10 text-sky-300' },
    { label: '学校数量', value: stats.total_schools, icon: School, color: 'bg-amber-500/10 text-amber-300' },
  ] : []

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">管理后台</h2>
          <p className="text-slate-500 text-sm mt-1">平台数据概览</p>
        </div>
        <Link to="/admin/users">
          <Button>用户管理</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Spinner /> <span className="text-sm">加载中...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-5 mb-6">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <Card.Body>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p
                        className="text-3xl font-bold text-white tabular-nums"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>

          {stats && Object.keys(stats.application_status_distribution).length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-slate-400" /> 申请状态分布
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(stats.application_status_distribution).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                      <p
                        className="text-2xl font-bold text-white tabular-nums"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {count}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{status}</p>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
