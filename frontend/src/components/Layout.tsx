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
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: '首页', icon: LayoutDashboard },
  { to: '/profile', label: '我的档案', icon: User },
  { to: '/schools', label: '学校库', icon: School },
  { to: '/schools/recommendations', label: '智能推荐', icon: Sparkles },
  { to: '/applications', label: '申请管理', icon: FileText },
  { to: '/documents', label: '文书生成', icon: BookOpen },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #120824 0%, #0f172a 60%, #0c1445 100%)' }}>
      {/* Ambient blobs (fixed behind everything) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="blob"
          style={{
            width: 500, height: 500,
            top: '-10%', left: '-5%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
            animationDuration: '18s',
          }}
        />
        <div
          className="blob"
          style={{
            width: 400, height: 400,
            bottom: '5%', right: '10%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
            animationDuration: '22s',
            animationDelay: '-6s',
          }}
        />
        <div
          className="blob"
          style={{
            width: 350, height: 350,
            top: '40%', left: '40%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
            animationDuration: '26s',
            animationDelay: '-12s',
          }}
        />
      </div>

      {/* Sidebar */}
      <aside
        className="glass-strong w-60 flex flex-col shrink-0 sticky top-0 h-screen z-10"
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}
            >
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                EasyApply
              </h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">AI 留学申请助手</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(14,165,233,0.15) 100%)',
                borderLeft: '2px solid rgba(167,139,250,0.6)',
                paddingLeft: 'calc(0.75rem - 2px)',
              } : {}}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {user?.is_admin && (
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(14,165,233,0.1) 100%)',
                borderLeft: '2px solid rgba(56,189,248,0.5)',
                paddingLeft: 'calc(0.75rem - 2px)',
              } : {}}
            >
              <Shield size={16} />
              管理后台
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}
            >
              {user?.nickname?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-300 truncate">{user?.nickname}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all duration-150"
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
