import { useEffect, useState, useMemo } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { checkDocuments } from '@/api/documents'
import {
  LayoutDashboard,
  User,
  School,
  Sparkles,
  FileText,
  BookOpen,
  LogOut,
  Shield,
  CalendarDays,
  ChevronDown,
  ScanSearch,
  MailSearch,
  Bug,
  Terminal,
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [hasDocuments, setHasDocuments] = useState(false)
  const [docExpanded, setDocExpanded] = useState(false)

  // 当路径在文书管理下时自动展开
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/documents') ||
        location.pathname.startsWith('/dashboard/ai-detection')) {
      setDocExpanded(true)
    }
  }, [location.pathname])

  useEffect(() => {
    checkDocuments()
      .then(r => setHasDocuments(r.data.has_documents))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = () => {
      checkDocuments()
        .then(r => setHasDocuments(r.data.has_documents))
        .catch(() => {})
    }
    window.addEventListener('documents-updated', handler)
    return () => window.removeEventListener('documents-updated', handler)
  }, [])

  const navItems = useMemo(() => {
    const items = [
      { to: '/dashboard', label: '首页', icon: LayoutDashboard, end: true },
      { to: '/dashboard/profile', label: '我的档案', icon: User, end: false },
      { to: '/dashboard/schools', label: '学校库', icon: School, end: true },
      { to: '/dashboard/schools/recommendations', label: '智能推荐', icon: Sparkles, end: false },
      { to: '/dashboard/applications', label: '申请管理', icon: FileText, end: false },
    ]
    items.push({ to: '/dashboard/timeline', label: '申请时间轴', icon: CalendarDays, end: false })
    return items
  }, [])

  const isDocActive = location.pathname.startsWith('/dashboard/documents') ||
                      location.pathname.startsWith('/dashboard/ai-detection')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive ? 'text-white' : 'hover:bg-gray-50'
    }`

  const navLinkInlineStyle = ({ isActive }: { isActive: boolean }) =>
    isActive ? {
      background: 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)',
      boxShadow: '0 4px 12px rgba(29,211,176,0.3)',
      color: 'white',
    } : { color: '#4b5563' }

  return (
    <div className="flex min-h-screen" style={{ background: '#f8fdfb' }}>
      {/* Sidebar */}
      <aside className="glass-strong w-60 flex flex-col shrink-0 sticky top-0 h-screen z-10">
        {/* Logo */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1dd3b0, #10b981)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight" style={{ color: '#0a0a0a', fontFamily: 'var(--font-display)' }}>
                EasyApply
              </h1>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: '#6b7280' }}>AI 留学申请助手</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={navLinkStyle}
              style={navLinkInlineStyle}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {/* 文书管理 — 可折叠父级 */}
          {hasDocuments && (
            <div>
              <button
                onClick={() => setDocExpanded(v => !v)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full hover:bg-gray-50"
                style={{
                  color: isDocActive ? '#059669' : '#4b5563',
                  background: isDocActive ? '#f0fdf9' : 'transparent',
                }}
              >
                <BookOpen size={16} />
                <span className="flex-1 text-left">文书管理</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: docExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: '#9ca3af',
                  }}
                />
              </button>

              {docExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 pl-3" style={{ borderLeft: '2px solid #e5e7eb' }}>
                  <NavLink to="/dashboard/documents" end={false}
                    className={navLinkStyle}
                    style={navLinkInlineStyle}
                  >
                    <FileText size={14} />
                    我的文书
                  </NavLink>
                  <NavLink to="/dashboard/ai-detection" end={false}
                    className={navLinkStyle}
                    style={navLinkInlineStyle}
                  >
                    <ScanSearch size={14} />
                    AI 检测破解
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {user?.is_admin && (
            <NavLink to="/dashboard/admin" end
              className={navLinkStyle}
              style={navLinkInlineStyle}
            >
              <Shield size={16} />
              管理后台
            </NavLink>
          )}

          {/* 智能邮箱助手 — 占位 */}
          <div className="mt-1">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed select-none"
              style={{ color: '#9ca3af' }}
              title="即将上线"
            >
              <MailSearch size={16} />
              <span className="flex-1">智能邮箱助手</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: '#f3f4f6', color: '#9ca3af', letterSpacing: '0.02em' }}>
                TODO
              </span>
            </div>
          </div>

          {/* DB Debug — 仅 nickname=aaaaaa 可见 */}
          {user?.nickname === 'aaaaaa' && (
            <NavLink to="/dashboard/db-debug" end
              className={navLinkStyle}
              style={navLinkInlineStyle}
            >
              <Bug size={16} />
              数据库调试
            </NavLink>
          )}
          {user?.nickname === 'aaaaaa' && (
            <NavLink to="/dashboard/backend-logs" end
              className={navLinkStyle}
              style={navLinkInlineStyle}
            >
              <Terminal size={16} />
              后端日志
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg, #1dd3b0, #10b981)' }}>
              {user?.nickname?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium truncate" style={{ color: '#374151' }}>{user?.nickname}</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all duration-150 hover:bg-gray-50"
            style={{ color: '#9ca3af' }}>
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
