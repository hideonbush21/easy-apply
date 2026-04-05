import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getProfile } from '@/api/profile'
import { getDeadlines } from '@/api/applications'
import type { UserProfile, Application } from '@/types'
import { ChevronRight, Clock, Sparkles, FileText, User, BookOpen, School } from 'lucide-react'
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
    {
      to: '/profile',
      label: '完善档案',
      desc: '补充背景信息',
      icon: User,
      gradient: 'from-violet-600 to-violet-400',
      glow: 'rgba(124,58,237,0.4)',
    },
    {
      to: '/schools',
      label: '浏览学校',
      desc: '探索目标院校',
      icon: School,
      gradient: 'from-sky-600 to-cyan-400',
      glow: 'rgba(14,165,233,0.4)',
    },
    {
      to: '/schools/recommendations',
      label: '智能推荐',
      desc: 'AI 精准选校',
      icon: Sparkles,
      gradient: 'from-emerald-600 to-teal-400',
      glow: 'rgba(16,185,129,0.4)',
    },
    {
      to: '/documents',
      label: '文书生成',
      desc: '推荐信 · 申请信',
      icon: BookOpen,
      gradient: 'from-amber-600 to-orange-400',
      glow: 'rgba(217,119,6,0.4)',
    },
    {
      to: '/applications',
      label: '申请管理',
      desc: '跟踪申请进度',
      icon: FileText,
      gradient: 'from-pink-600 to-rose-400',
      glow: 'rgba(225,29,72,0.4)',
    },
  ]

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.35s ease-out' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="pill mb-3">
          <span className="status-dot-live" />
          <span>智能申请助手</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          你好，<span className="gradient-text">{user?.nickname}</span>
        </h2>
        <p className="text-slate-400 text-sm">欢迎回到 EasyApply — 让 AI 助力你的留学申请之路</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Profile completion */}
        <Card className="col-span-1 glass">
          <Card.Body>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">档案完整度</p>
            <div className="flex items-end gap-2 mb-4">
              <span
                className="text-4xl font-bold tabular-nums gradient-text"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {Math.round(completion)}%
              </span>
            </div>
            <ProgressBar value={completion} className="mb-4" />
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              完善档案 <ChevronRight size={14} />
            </Link>
          </Card.Body>
        </Card>

        {/* Upcoming deadlines */}
        <Card className="col-span-2 glass">
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Clock size={13} className="text-sky-400" />
                近 30 天截止申请
              </p>
              <Link to="/applications" className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors">
                查看全部 →
              </Link>
            </div>
            {deadlines.length === 0 ? (
              <EmptyState
                icon={<Clock size={18} className="text-slate-500" />}
                title="暂无即将截止的申请"
                description="添加申请后，截止日期将在此显示"
              />
            ) : (
              <div className="space-y-1">
                {deadlines.slice(0, 4).map(app => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {app.school?.name_cn || app.school?.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{app.major || '未指定专业'}</p>
                    </div>
                    <span className="text-xs text-rose-400 font-semibold tabular-nums">
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
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">快速入口</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickLinks.map(({ to, label, desc, icon: Icon, gradient, glow }) => (
            <Link key={to} to={to}>
              <div
                className="glass-hover p-5 flex flex-col items-center gap-3 text-center group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
                  style={{ boxShadow: `0 0 20px ${glow}` }}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-0.5">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
