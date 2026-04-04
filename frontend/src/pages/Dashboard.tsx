import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getProfile } from '@/api/profile'
import { getDeadlines } from '@/api/applications'
import type { UserProfile, Application } from '@/types'
import { ChevronRight, Clock, Star, FileText, User } from 'lucide-react'

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
    { to: '/profile', label: '完善档案', icon: User, color: 'bg-blue-50 text-blue-700' },
    { to: '/schools', label: '浏览学校', icon: Star, color: 'bg-amber-50 text-amber-700' },
    { to: '/schools/recommendations', label: '智能推荐', icon: Star, color: 'bg-green-50 text-green-700' },
    { to: '/applications', label: '管理申请', icon: FileText, color: 'bg-purple-50 text-purple-700' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">你好, {user?.nickname}</h2>
        <p className="text-gray-500 mt-1">欢迎回到 EasyApply 留学申请管理平台</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile completion */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 col-span-1">
          <h3 className="text-sm font-medium text-gray-500 mb-3">档案完整度</h3>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-gray-900">{Math.round(completion)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <Link
            to="/profile"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            完善档案 <ChevronRight size={14} />
          </Link>
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock size={16} />
              近 30 天截止申请
            </h3>
            <Link to="/applications" className="text-sm text-blue-600 hover:underline">
              查看全部
            </Link>
          </div>
          {deadlines.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">暂无即将截止的申请</p>
          ) : (
            <div className="space-y-3">
              {deadlines.slice(0, 4).map(app => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {app.school?.name_cn || app.school?.name}
                    </p>
                    <p className="text-xs text-gray-500">{app.major || '未指定专业'}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    {app.application_deadline}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-4">快速入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow flex flex-col items-center gap-3 text-center"
            >
              <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                <Icon size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
