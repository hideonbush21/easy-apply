import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
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
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: '首页', icon: LayoutDashboard, end: true },
  { to: '/dashboard/profile', label: '我的档案', icon: User, end: false },
  { to: '/dashboard/schools', label: '学校库', icon: School, end: true },
  { to: '/dashboard/schools/recommendations', label: '智能推荐', icon: Sparkles, end: false },
  { to: '/dashboard/applications', label: '申请管理', icon: FileText, end: false },
  { to: '/dashboard/documents', label: '文书生成', icon: BookOpen, end: false },
  { to: '/dashboard/timeline', label: '申请时间轴', icon: CalendarDays, end: false },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f8fdfb' }}>
      {/* Sidebar */}
      <aside className="glass-strong w-60 flex flex-col shrink-0 sticky top-0 h-screen z-10">
        {/* Logo */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1dd3b0, #10b981)' }}
            >
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
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)',
                boxShadow: '0 4px 12px rgba(29,211,176,0.3)',
                color: 'white',
              } : { color: '#4b5563' }}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {user?.is_admin && (
            <NavLink
              to="/dashboard/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive ? 'text-white' : 'hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)',
                color: 'white',
              } : { color: '#4b5563' }}
            >
              <Shield size={16} />
              管理后台
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg, #1dd3b0, #10b981)' }}
            >
              {user?.nickname?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium truncate" style={{ color: '#374151' }}>{user?.nickname}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all duration-150 hover:bg-gray-50"
            style={{ color: '#9ca3af' }}
          >
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
