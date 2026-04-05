import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getProfile } from '@/api/profile'
import { getDeadlines } from '@/api/applications'
import type { UserProfile, Application } from '@/types'
import { ChevronRight, Clock, Star, FileText, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [deadlines, setDeadlines] = useState<Application[]>([])

  useEffect(() => {
    getProfile().then(r => setProfile(r.data)).catch(() => null)
    getDeadlines().then(r => setDeadlines(r.data)).catch(() => null)
  }, [])

  const completion = profile?.completion_rate ?? 0

  const quickLinks = [
    { to: '/profile', label: '完善档案', icon: User, color: 'bg-primary-50 text-primary-700' },
    { to: '/schools', label: '浏览学校', icon: Star, color: 'bg-amber-50 text-amber-700' },
    { to: '/schools/recommendations', label: '智能推荐', icon: Star, color: 'bg-success-50 text-success-700' },
    { to: '/applications', label: '管理申请', icon: FileText, color: 'bg-accent-50 text-accent-700' },
  ]

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">你好，{user?.nickname}</h2>
        <p className="text-slate-500 mt-1 text-sm">欢迎回到 EasyApply 留学申请管理平台</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Profile completion */}
        <Card className="col-span-1">
          <Card.Body>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              档案完整度
            </h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-bold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                {Math.round(completion)}%
              </span>
            </div>
            <ProgressBar value={completion} className="mb-4" />
            <Link
              to="/profile"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
            >
              完善档案 <ChevronRight size={14} />
            </Link>
          </Card.Body>
        </Card>

        {/* Upcoming deadlines */}
        <Card className="col-span-2">
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} />
                近 30 天截止申请
              </h3>
              <Link to="/applications" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                查看全部
              </Link>
            </div>
            {deadlines.length === 0 ? (
              <EmptyState
                icon={<Clock size={20} />}
                title="暂无即将截止的申请"
                description="添加申请后，截止日期将在此显示"
              />
            ) : (
              <div className="space-y-2">
                {deadlines.slice(0, 4).map(app => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {app.school?.name_cn || app.school?.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{app.major || '未指定专业'}</p>
                    </div>
                    <span className="text-xs text-danger-600 font-semibold tabular-nums">
                      {app.application_deadline}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">快速入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to}>
              <Card
                hover
                className="p-5 flex flex-col items-center gap-3 text-center"
              >
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
