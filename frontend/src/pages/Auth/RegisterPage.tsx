import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { register } from '@/api/auth'
import { syncOnboarding } from '@/api/profile'
import { CheckCircle, ArrowLeft } from 'lucide-react'

async function _syncOnboardingIfNeeded() {
  try {
    const raw = sessionStorage.getItem('onboarding_data')
    if (!raw) return
    const data = JSON.parse(raw)
    await syncOnboarding(data)
    sessionStorage.removeItem('onboarding_data')
  } catch {
    // 静默失败，不影响注册流程
  }
}

export default function RegisterPage() {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
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
      await _syncOnboardingIfNeeded()
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    border: `1.5px solid ${focusedField === field ? '#1dd3b0' : '#e5e7eb'}`,
    borderRadius: 10,
    fontSize: 14,
    color: '#0a0a0a',
    background: 'white',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(29,211,176,0.12)' : 'none',
    boxSizing: 'border-box',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0d9e88 0%, #1dd3b0 50%, #34d399 100%)',
      }}
        className="hidden lg:flex"
      >
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(1px)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', top: '35%', left: 40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <img src="/favicon.svg" alt="EasyApply" style={{ width: 40, height: 40 }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>EasyApply</span>
          </Link>

          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.25, marginBottom: 16 }}>
            加入 10,000+<br />申请成功的学生
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 40 }}>
            免费注册，立即获得 AI 选校评估，<br />开启你的精准申请之路。
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['永久免费基础版', '5分钟快速上手', '银行级数据加密'].map(t => (
              <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.95)', fontSize: 15 }}>
                <CheckCircle size={18} color="white" style={{ flexShrink: 0 }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px', background: '#fafafa' }}>

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 32 }} className="flex lg:hidden">
          <img src="/favicon.svg" alt="EasyApply" style={{ width: 36, height: 36 }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0a0a0a' }}>EasyApply</span>
        </Link>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 32, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1dd3b0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
            <ArrowLeft size={14} /> 返回首页
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0a0a0a', marginBottom: 6 }}>创建账号</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>开始你的留学申请之旅</p>

          {error && (
            <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>用户名</label>
              <input
                type="text" value={nickname} required maxLength={50} placeholder="2-50个字符"
                onChange={e => setNickname(e.target.value)}
                onFocus={() => setFocusedField('nickname')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('nickname')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>密码</label>
              <input
                type="password" value={password} required minLength={6} placeholder="至少6位"
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('password')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>确认密码</label>
              <input
                type="password" value={confirm} required placeholder="再次输入密码"
                onChange={e => setConfirm(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('confirm')}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px 0', border: 'none', borderRadius: 10,
                background: loading ? '#a7f3d0' : 'linear-gradient(135deg, #1dd3b0, #10b981)',
                color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.2s',
                boxShadow: '0 4px 14px rgba(29,211,176,0.35)',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? '注册中...' : '免费注册'}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
            已有账号？{' '}
            <Link to="/login" style={{ color: '#1dd3b0', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
