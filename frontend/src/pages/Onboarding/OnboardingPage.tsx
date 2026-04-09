import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── CSS ─── */
const onboardingCSS = `
  .ob-gradient-btn {
    background: linear-gradient(135deg, #1dd3b0 0%, #10b981 100%);
  }
  .ob-gradient-btn:disabled {
    background: #d1d5db !important;
    cursor: not-allowed !important;
    box-shadow: none !important;
  }
  .ob-option-card {
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid #e5e7eb;
    position: relative;
    background: white;
    border-radius: 12px;
  }
  .ob-option-card:hover {
    border-color: #1dd3b0;
  }
  .ob-option-card.selected {
    border-color: #1dd3b0;
    background: #f0fdf9;
  }
  .ob-option-card.selected .ob-check {
    border-color: #1dd3b0;
    background: #1dd3b0;
  }
  .ob-option-card.selected .ob-check-icon {
    opacity: 1;
  }
  .ob-check {
    width: 22px;
    height: 22px;
    border: 2px solid #e5e7eb;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .ob-check-icon {
    opacity: 0;
    color: white;
  }
  .ob-input {
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    color: #111827;
    background: white;
    outline: none;
    box-sizing: border-box;
  }
  .ob-input:focus {
    border-color: #1dd3b0;
    box-shadow: 0 0 0 3px rgba(29, 211, 176, 0.1);
  }
  .ob-input::placeholder { color: #9ca3af; }
  .ob-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
    padding-right: 36px;
  }
  @keyframes ob-fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ob-fade { animation: ob-fadeInUp 0.45s ease-out both; }
  .ob-fade-1 { animation-delay: 0s; }
  .ob-fade-2 { animation-delay: 0.1s; }
  .ob-fade-3 { animation-delay: 0.2s; }
  .ob-fade-4 { animation-delay: 0.3s; }
  .ob-modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .ob-modal {
    background: white;
    border-radius: 20px;
    padding: 32px 28px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 24px 64px rgba(0,0,0,0.18);
    animation: ob-fadeInUp 0.35s ease-out both;
  }
`

/* ─── Step indicator ─── */
function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4].map((n, i) => {
        const done = n < current
        const active = n === current
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: done || active ? 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)' : '#e5e7eb',
              color: done || active ? 'white' : '#9ca3af',
            }}>
              {done
                ? <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                : n}
            </div>
            {i < 3 && (
              <div style={{ width: 32, height: 2, background: done ? '#1dd3b0' : '#e5e7eb' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Check icon svg ─── */
const CheckSVG = () => (
  <svg className="ob-check-icon" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
)

/* ─── Data ─── */
interface OnboardingData {
  goals: string[]
  programs: string[]
  stage: string
  university: string
  college: string
  major: string
  gpa: string
  gpaMax: string
  direction: string
}

/* ─── Main ─── */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    programs: [],
    stage: '',
    university: '', college: '', major: '', gpa: '', gpaMax: '4.0', direction: '',
  })

  // inject CSS once
  useState(() => {
    const id = 'ob-styles'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id; s.textContent = onboardingCSS
      document.head.appendChild(s)
    }
  })

  const toggleGoal = (label: string) => {
    setData(d => ({
      ...d,
      goals: d.goals.includes(label) ? d.goals.filter(g => g !== label) : [...d.goals, label]
    }))
  }
  const toggleProgram = (label: string) => {
    setData(d => ({
      ...d,
      programs: d.programs.includes(label) ? d.programs.filter(p => p !== label) : [...d.programs, label]
    }))
  }
  const selectStage = (label: string) => setData(d => ({ ...d, stage: label }))

  const canNext2 = data.programs.length > 0
  const canNext3 = data.stage !== ''
  const canSubmit = data.university.trim() !== '' && data.major.trim() !== '' && data.direction.trim() !== ''

  /* ── Shared wrapper ── */
  const wrap = (content: React.ReactNode) => (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      background: 'linear-gradient(180deg, #f8fdfb 0%, #ffffff 100%)',
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
    }}>
      {/* CSS inject */}
      <style>{onboardingCSS}</style>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: 576, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
            <button onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1dd3b0, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>EasyApply</span>
            </button>
            <StepDots current={step} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 448 }}>
          {content}
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="ob-modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="ob-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1dd3b0, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>保存并查看推荐结果</h2>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                登录或注册以保存你的信息，<br />获取个性化院校推荐方案
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => navigate('/register')}
                className="ob-gradient-btn"
                style={{ width: '100%', padding: '13px 0', border: 'none', color: 'white', borderRadius: 999, fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 6px 16px rgba(29,211,176,0.3)' }}>
                免费注册，查看推荐
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '13px 0', background: 'white', border: '1.5px solid #e5e7eb', color: '#374151', borderRadius: 999, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
                已有账号，直接登录
              </button>
            </div>

            <button onClick={() => setShowLoginModal(false)}
              style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}>
              稍后再说
            </button>
          </div>
        </div>
      )}
    </div>
  )

  /* ── Step 1 ── */
  if (step === 1) {
    const goals = [
      { emoji: '🔍', title: '智能选校推荐', sub: 'AI 精准匹配' },
      { emoji: '📅', title: '申请时间线', sub: '个性化规划' },
      { emoji: '📁', title: '材料管理', sub: '一站式管理' },
      { emoji: '✍️', title: '文书助手', sub: 'AI 辅助撰写' },
    ]
    return wrap(
      <>
        {/* Icon */}
        <div className="ob-fade ob-fade-1" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2} /><path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="ob-fade ob-fade-2" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>你想获得哪些帮助？</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>选择你感兴趣的服务</p>
        </div>

        <div className="ob-fade ob-fade-3" style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {goals.map(g => {
              const sel = data.goals.includes(g.title)
              return (
                <div key={g.title}
                  className={`ob-option-card${sel ? ' selected' : ''}`}
                  onClick={() => toggleGoal(g.title)}
                  style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                    <div className="ob-check"><CheckSVG /></div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{g.sub}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ob-fade ob-fade-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <button className="ob-gradient-btn"
            onClick={() => setStep(2)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', border: 'none', color: 'white', borderRadius: 999, fontWeight: 500, cursor: 'pointer', fontSize: 14, boxShadow: '0 6px 16px rgba(29,211,176,0.25)' }}>
            开始规划
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </>
    )
  }

  /* ── Step 2 ── */
  if (step === 2) {
    const programs = [
      { emoji: '🇺🇸', title: '美国硕士', sub: 'Top 名校云集', badge: '热门', badgeColor: '#ef4444' },
      { emoji: '🇬🇧', title: '英国硕士', sub: '学制短、认可度高', badge: null, badgeColor: '' },
      { emoji: '🇭🇰', title: '港新硕士', sub: '性价比之选', badge: '推荐', badgeColor: '#1dd3b0' },
      { emoji: '🤔', title: '还没决定', sub: '帮你分析', badge: null, badgeColor: '' },
    ]
    return wrap(
      <>
        <div className="ob-fade ob-fade-1" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="ob-fade ob-fade-2" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>你计划申请哪类项目？</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>可多选，帮助我们更准确地推荐</p>
        </div>

        <div className="ob-fade ob-fade-3" style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {programs.map(p => {
              const sel = data.programs.includes(p.title)
              return (
                <div key={p.title}
                  className={`ob-option-card${sel ? ' selected' : ''}`}
                  onClick={() => toggleProgram(p.title)}
                  style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{p.sub}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.badge && (
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 500, background: p.badge === '热门' ? '#ef4444' : '#1dd3b0', color: 'white' }}>
                        {p.badge}
                      </span>
                    )}
                    <div className="ob-check"><CheckSVG /></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ob-fade ob-fade-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setStep(1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <button className="ob-gradient-btn"
            onClick={() => canNext2 && setStep(3)}
            disabled={!canNext2}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', border: 'none', color: 'white', borderRadius: 999, fontWeight: 500, cursor: canNext2 ? 'pointer' : 'not-allowed', fontSize: 14, boxShadow: canNext2 ? '0 6px 16px rgba(29,211,176,0.25)' : 'none' }}>
            下一步
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </>
    )
  }

  /* ── Step 3 ── */
  if (step === 3) {
    const stages = [
      { emoji: '📚', title: '不到大三', sub: '早期规划，时间充裕', tag: '最佳准备期', tagColor: '#166534', tagBg: '#dcfce7' },
      { emoji: '🎯', title: '大三',   sub: '黄金准备期',      tag: '关键冲刺',   tagColor: '#1e40af', tagBg: '#dbeafe' },
      { emoji: '🚀', title: '大四',   sub: '申请冲刺期',      tag: '紧迫但可行', tagColor: '#9a3412', tagBg: '#ffedd5' },
      { emoji: '💼', title: '已毕业', sub: 'Gap 或在职申请',  tag: '灵活安排',   tagColor: '#6b21a8', tagBg: '#f3e8ff' },
    ]
    return wrap(
      <>
        <div className="ob-fade ob-fade-1" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} /><polyline points="12 6 12 12 16 14" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="ob-fade ob-fade-2" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>你目前处于哪个阶段？</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>我们将据此为你规划最佳时间线</p>
        </div>

        <div className="ob-fade ob-fade-3" style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stages.map(s => {
              const sel = data.stage === s.title
              return (
                <div key={s.title}
                  className={`ob-option-card${sel ? ' selected' : ''}`}
                  onClick={() => selectStage(s.title)}
                  style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{s.emoji}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 500, background: s.tagBg, color: s.tagColor }}>{s.tag}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                  <div className="ob-check"><CheckSVG /></div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ob-fade ob-fade-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setStep(2)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <button className="ob-gradient-btn"
            onClick={() => canNext3 && setStep(4)}
            disabled={!canNext3}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', border: 'none', color: 'white', borderRadius: 999, fontWeight: 500, cursor: canNext3 ? 'pointer' : 'not-allowed', fontSize: 14, boxShadow: canNext3 ? '0 6px 16px rgba(29,211,176,0.25)' : 'none' }}>
            下一步
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </>
    )
  }

  /* ── Step 4 ── */
  return wrap(
    <>
      <div className="ob-fade ob-fade-1" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      <div className="ob-fade ob-fade-2" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>告诉我们你的背景</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>填写基础信息，获取精准推荐</p>
      </div>

      <div className="ob-fade ob-fade-3" style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 本科院校 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              本科院校 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input className="ob-input" placeholder="例如：北京大学、南京大学" value={data.university}
              onChange={e => setData(d => ({ ...d, university: e.target.value }))} />
          </div>

          {/* 学院 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>学院（可选）</label>
            <input className="ob-input" placeholder="例如：计算机学院、商学院" value={data.college}
              onChange={e => setData(d => ({ ...d, college: e.target.value }))} />
          </div>

          {/* 专业 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              专业 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input className="ob-input" placeholder="例如：计算机科学与技术" value={data.major}
              onChange={e => setData(d => ({ ...d, major: e.target.value }))} />
          </div>

          {/* GPA + 满分 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>GPA（可选）</label>
              <input className="ob-input" placeholder="3.5" value={data.gpa}
                onChange={e => setData(d => ({ ...d, gpa: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>满分</label>
              <select className="ob-input ob-select" value={data.gpaMax}
                onChange={e => setData(d => ({ ...d, gpaMax: e.target.value }))}>
                <option value="4.0">4.0</option>
                <option value="5.0">5.0</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* 申请方向 */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              申请方向 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input className="ob-input" placeholder="例如：数据科学、金融、传媒" value={data.direction}
              onChange={e => setData(d => ({ ...d, direction: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="ob-fade ob-fade-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setStep(3)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          返回
        </button>
        <button className="ob-gradient-btn"
          onClick={() => {
            if (canSubmit) {
              sessionStorage.setItem('onboarding_data', JSON.stringify(data))
              setShowLoginModal(true)
            }
          }}
          disabled={!canSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', border: 'none', color: 'white', borderRadius: 999, fontWeight: 500, cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: 14, boxShadow: canSubmit ? '0 6px 16px rgba(29,211,176,0.25)' : 'none' }}>
          生成推荐
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>
      </div>

      <p className="ob-fade ob-fade-4" style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
        点击「生成推荐」将根据你的背景从数据库匹配最适合的项目
      </p>
    </>
  )
}
