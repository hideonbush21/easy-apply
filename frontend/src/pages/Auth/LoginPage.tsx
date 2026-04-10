import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { login, sendCode, emailLogin } from '@/api/auth'
import { syncOnboarding } from '@/api/profile'
import { CheckCircle, ArrowLeft, Mail, User } from 'lucide-react'

async function _syncOnboardingIfNeeded(): Promise<boolean> {
  try {
    const raw = sessionStorage.getItem('onboarding_data')
    if (!raw) return false
    const data = JSON.parse(raw)
    await syncOnboarding(data)
    sessionStorage.removeItem('onboarding_data')
    return true
  } catch {
    sessionStorage.removeItem('onboarding_data')
    return false
  }
}

function _redirect(fromOnboarding: boolean) {
  window.location.href = fromOnboarding
    ? '/dashboard/schools/recommendations?autoGenerate=true'
    : '/dashboard'
}

export default function LoginPage() {
  const [tab, setTab] = useState<'password' | 'email'>('email')

  // 昵称密码 tab
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')

  // 邮箱验证码 tab
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const setAuth = useAuthStore(s => s.setAuth)

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

  const startCountdown = () => {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email.trim() || countdown > 0 || loading) return
    setError('')
    setLoading(true)
    try {
      await sendCode(email.trim())
      setCodeSent(true)
      startCountdown()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await emailLogin(email.trim(), code.trim())
      setAuth(res.data.access_token, res.data.user)
      const fromOnboarding = await _syncOnboardingIfNeeded()
      _redirect(fromOnboarding)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '验证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(nickname, password)
      setAuth(res.data.access_token, res.data.user)
      const fromOnboarding = await _syncOnboardingIfNeeded()
      _redirect(fromOnboarding)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (t: 'password' | 'email'): React.CSSProperties => ({
    flex: 1,
    padding: '9px 0',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: tab === t ? 'white' : 'transparent',
    color: tab === t ? '#0a0a0a' : '#6b7280',
    boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0d9e88 0%, #1dd3b0 50%, #34d399 100%)',
      }} className="hidden lg:flex">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(1px)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', top: '40%', right: 40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <img src="/favicon.svg" alt="EasyApply" style={{ width: 40, height: 40 }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>EasyApply</span>
          </Link>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.25, marginBottom: 16 }}>
            开启你的<br />留学申请之旅
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 40 }}>
            基于50万+真实录取数据，AI全程陪伴，<br />让申请更简单、高效、精准。
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['AI智能选校推荐', '文书一键生成优化', '申请进度全程追踪'].map(t => (
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
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 32 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1dd3b0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
            <ArrowLeft size={14} /> 返回首页
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0a0a0a', marginBottom: 6 }}>欢迎回来</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>登录你的 EasyApply 账号</p>

          {/* Tab */}
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 28 }}>
            <button style={tabStyle('email')} onClick={() => { setTab('email'); setError('') }}>
              <Mail size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              邮箱验证码
            </button>
            <button style={tabStyle('password')} onClick={() => { setTab('password'); setError('') }}>
              <User size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              用户名密码
            </button>
          </div>

          {error && (
            <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {tab === 'email' ? (
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>邮箱</label>
                <input
                  type="email" value={email} required placeholder="请输入邮箱地址"
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('email')}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>验证码</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text" value={code} required placeholder="6位验证码" maxLength={6}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setFocusedField('code')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle('code'), flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || loading || !email.trim()}
                    style={{
                      flexShrink: 0, padding: '12px 16px', border: '1.5px solid #1dd3b0', borderRadius: 10,
                      background: countdown > 0 || !email.trim() ? '#f9fafb' : 'white',
                      color: countdown > 0 || !email.trim() ? '#9ca3af' : '#1dd3b0',
                      fontSize: 13, fontWeight: 600, cursor: countdown > 0 || !email.trim() ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', transition: 'all 0.2s',
                    }}
                  >
                    {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送验证码'}
                  </button>
                </div>
                {codeSent && (
                  <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>验证码已发送至 {email}，5分钟内有效</p>
                )}
              </div>
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px 0', border: 'none', borderRadius: 10,
                  background: loading ? '#a7f3d0' : 'linear-gradient(135deg, #1dd3b0, #10b981)',
                  color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(29,211,176,0.35)', transition: 'transform 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {loading ? '验证中...' : '登录 / 注册'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>用户名</label>
                <input
                  type="text" value={nickname} required placeholder="请输入用户名"
                  onChange={e => setNickname(e.target.value)}
                  onFocus={() => setFocusedField('nickname')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('nickname')}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>密码</label>
                <input
                  type="password" value={password} required placeholder="请输入密码"
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('password')}
                />
              </div>
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px 0', border: 'none', borderRadius: 10,
                  background: loading ? '#a7f3d0' : 'linear-gradient(135deg, #1dd3b0, #10b981)',
                  color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(29,211,176,0.35)', transition: 'transform 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          )}

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
            还没有账号？{' '}
            <Link to="/register" style={{ color: '#1dd3b0', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
