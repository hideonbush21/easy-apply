import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { register } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      const res = await register(nickname, password)
      setAuth(res.data.access_token, res.data.user)
      navigate('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="w-full max-w-sm" style={{ animation: 'scale-in 0.25s ease-out' }}>
        {/* Brand */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            EasyApply
          </h1>
          <p className="text-sm text-slate-400 mt-1">留学申请助手</p>
        </div>

        <div
          className="bg-white rounded-2xl p-8"
          style={{ boxShadow: 'var(--shadow-modal)', border: '1px solid rgba(148,163,184,0.12)' }}
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-1">创建账号</h2>
          <p className="text-sm text-slate-500 mb-6">开始你的留学申请之旅</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-danger-50 border border-danger-100 rounded-xl text-sm text-danger-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="用户名"
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
              maxLength={50}
              placeholder="2-50个字符"
            />
            <Input
              label="密码"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="至少6位"
            />
            <Input
              label="确认密码"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="再次输入密码"
            />
            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            已有账号?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
