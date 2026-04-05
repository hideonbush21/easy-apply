import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard,
  User,
  School,
  Star,
  FileText,
  Mail,
  LogOut,
  Shield,
} from 'lucide-react'

const navItems = [
  { to: '/', label: '首页', icon: LayoutDashboard },
  { to: '/profile', label: '我的档案', icon: User },
  { to: '/schools', label: '学校库', icon: School },
  { to: '/schools/recommendations', label: '智能推荐', icon: Star },
  { to: '/applications', label: '申请管理', icon: FileText },
  { to: '/recommendations', label: '推荐信', icon: Mail },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-surface-alt">
      {/* Sidebar */}
      <aside
        className="w-60 bg-surface flex flex-col shrink-0"
        style={{ boxShadow: 'var(--shadow-sidebar)' }}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            EasyApply
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">留学申请助手</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          {user?.is_admin && (
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-50 text-accent-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Shield size={17} />
              管理后台
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))' }}
            >
              {user?.nickname?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-700 truncate">{user?.nickname}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-150"
          >
            <LogOut size={17} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
