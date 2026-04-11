import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getProfile } from '@/api/profile'
import { getDeadlines, getApplications } from '@/api/applications'
import type { UserProfile, Application } from '@/types'
import { ChevronRight, Clock, Sparkles, FileText, User, BookOpen, School } from 'lucide-react'
import ApplicationCalendar from '@/components/ApplicationCalendar'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [deadlines, setDeadlines] = useState<Application[]>([])
  const [allApplications, setAllApplications] = useState<Application[]>([])

  useEffect(() => {
    getProfile().then(r => setProfile(r.data)).catch(() => null)
    getDeadlines().then(r => setDeadlines(r.data)).catch(() => null)
    getApplications().then(r => setAllApplications(r.data)).catch(() => null)
  }, [])

  const completion = profile?.completion_rate ?? 0
  const pct = Math.min(100, Math.max(0, completion))

  const quickLinks = [
    { to: '/dashboard/profile',                    label: '完善档案', desc: '补充背景信息',   icon: User,     color: '#8b5cf6', bg: '#f5f3ff' },
    { to: '/dashboard/schools',                    label: '浏览学校', desc: '探索目标院校',   icon: School,   color: '#0ea5e9', bg: '#f0f9ff' },
    { to: '/dashboard/schools/recommendations',    label: '智能推荐', desc: 'AI 精准选校',    icon: Sparkles, color: '#1dd3b0', bg: '#e6faf6' },
    { to: '/dashboard/documents',                  label: '文书生成', desc: '推荐信 · 申请信', icon: BookOpen, color: '#f59e0b', bg: '#fffbeb' },
    { to: '/dashboard/applications',               label: '申请管理', desc: '跟踪申请进度',   icon: FileText, color: '#ef4444', bg: '#fff1f2' },
  ]

  return (
    <div style={{ padding: '32px', animation: 'fade-in 0.35s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: '#e6faf6', border: '1px solid rgba(29,211,176,0.3)', fontSize: 12, fontWeight: 500, color: '#0d9e72', marginBottom: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1dd3b0', display: 'inline-block' }} />
          智能申请助手
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 6, fontFamily: 'var(--font-display)' }}>
          你好，<span style={{ background: 'linear-gradient(135deg,#1dd3b0,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.nickname}</span>
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280' }}>欢迎回到 EasyApply — 让 AI 助力你的留学申请之路</p>
      </div>

      {/* Top cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 28 }}>
        {/* Profile completion */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>档案完整度</p>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 36, fontWeight: 700, background: 'linear-gradient(135deg,#1dd3b0,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-display)' }}>
              {Math.round(completion)}%
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: 'linear-gradient(90deg,#1dd3b0,#10b981)', transition: 'width 0.7s ease-out', boxShadow: pct > 0 ? '0 0 8px rgba(29,211,176,0.4)' : 'none' }} />
          </div>
          <Link to="/dashboard/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#1dd3b0', fontWeight: 600, textDecoration: 'none' }}>
            完善档案 <ChevronRight size={14} />
          </Link>
        </div>

        {/* Upcoming deadlines */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e5e7eb', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} style={{ color: '#1dd3b0' }} />
              近 30 天截止申请
            </p>
            <Link to="/dashboard/applications" style={{ fontSize: 12, color: '#1dd3b0', fontWeight: 500, textDecoration: 'none' }}>
              查看全部 →
            </Link>
          </div>

          {deadlines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Clock size={18} style={{ color: '#9ca3af' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>暂无即将截止的申请</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>添加申请后，截止日期将在此显示</p>
            </div>
          ) : (
            <div>
              {deadlines.slice(0, 4).map((app, i) => (
                <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{app.school?.name_cn || app.school?.name}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{app.major || '未指定专业'}</p>
                  </div>
                  <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{app.application_deadline}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Calendar */}
      <div style={{ marginBottom: 28 }}>
        <ApplicationCalendar applications={allApplications} />
      </div>

      {/* Quick links */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>快速入口</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {quickLinks.map(({ to, label, desc, icon: Icon, color, bg }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff', borderRadius: 14, border: '1.5px solid #e5e7eb',
                padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
                transition: 'all 0.2s ease', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${color}22`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
