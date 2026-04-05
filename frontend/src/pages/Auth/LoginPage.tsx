import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { login } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(nickname, password)
      setAuth(res.data.access_token, res.data.user)
      navigate('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #120824 0%, #0f172a 60%, #0c1445 100%)' }}
    >
      {/* Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob" style={{ width: 500, height: 500, top: '-15%', left: '-10%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', animationDuration: '18s' }} />
        <div className="blob" style={{ width: 400, height: 400, bottom: '-10%', right: '-5%', background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)', animationDuration: '22s', animationDelay: '-8s' }} />
      </div>

      <div className="w-full max-w-sm relative z-10" style={{ animation: 'scale-in 0.25s ease-out' }}>
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>EasyApply</span>
          </div>
          <p className="text-sm text-slate-500">AI 驱动的留学申请平台</p>
        </div>

        <div className="glass p-8">
          <h2 className="text-xl font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>欢迎回来</h2>
          <p className="text-sm text-slate-400 mb-6">登录你的 EasyApply 账号</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-rose-300 border border-rose-500/20" style={{ background: 'rgba(244,63,94,0.1)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="用户名" type="text" value={nickname} onChange={e => setNickname(e.target.value)} required placeholder="请输入用户名" />
            <Input label="密码" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="请输入密码" />
            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            还没有账号?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
