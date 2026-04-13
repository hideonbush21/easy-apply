import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, ArrowRight, Play, CheckCircle, MapPin, FileText,
  FolderOpen, Calendar, UserPlus, Target, Rocket, Quote, Star,
  Award, MessageCircle, Link, ExternalLink, Globe, Mail, Menu, X, Check
} from 'lucide-react'

function FeishuModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 24,
          padding: '40px 36px 32px',
          maxWidth: 360, width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          textAlign: 'center', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: '#f3f4f6', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6b7280',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #1dd3b0, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageCircle size={24} color="white" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
            联系我们
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            扫描二维码，添加飞书联系我们
          </p>
        </div>

        <div style={{
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid #e5e7eb',
          marginBottom: 20,
        }}>
          <img src="/feishu.jpg" alt="飞书联系二维码" style={{ width: '100%', display: 'block' }} />
        </div>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
          工作时间：周一至周五 9:00–18:00<br />
          我们会在 24 小时内回复您
        </p>
      </div>
    </div>
  )
}

/* ─── CSS injected once ─── */
const landingCSS = `
  .lp-gradient-text {
    background: linear-gradient(135deg, #1dd3b0 0%, #0a8a72 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lp-gradient-btn {
    background: linear-gradient(135deg, #1dd3b0 0%, #10b981 100%);
  }
  .lp-logo-marquee {
    display: flex;
    width: fit-content;
    animation: lp-logo-scroll 60s linear infinite;
  }
  .lp-logo-marquee:hover { animation-play-state: paused; }
  @keyframes lp-logo-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes lp-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-20px); }
  }
  @keyframes lp-gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  .lp-float  { animation: lp-float 6s ease-in-out infinite; }
  .lp-float2 { animation: lp-float 6s ease-in-out infinite; animation-delay: 3s; }
  .lp-reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .lp-reveal.active {
    opacity: 1;
    transform: translateY(0);
  }
  .lp-hover-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .lp-hover-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  .lp-hero-btn-primary {
    background: linear-gradient(135deg, #1dd3b0, #10b981);
    transition: all 0.3s ease;
  }
  .lp-hero-btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(29,211,176,0.35);
  }
  .lp-hero-btn-secondary {
    transition: all 0.3s ease;
  }
  .lp-hero-btn-secondary:hover {
    transform: translateY(-3px);
    background-color: #f9fafb;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    border-color: #1dd3b0;
  }
  .lp-feature-icon {
    transition: background 0.3s, color 0.3s;
  }
  .lp-feature-card:hover .lp-feature-icon {
    background: #0fa88c !important;
  }
  .lp-feature-card:hover .lp-feature-icon svg {
    stroke: white !important;
    color: white !important;
  }
  .lp-cta-bg {
    background: linear-gradient(135deg, #1dd3b0, #10b981, #1dd3b0);
    background-size: 200% 100%;
    animation: lp-gradient-shift 8s ease infinite;
  }
  .lp-nav-scrolled {
    background: rgba(255,255,255,0.92) !important;
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 8px rgba(0,0,0,0.08);
  }
`

/* ─── Counter hook ─── */
function useCounter(target: number, started: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!started) return
    const duration = 800
    const step = target / (duration / 16)
    let current = 0
    const tick = () => {
      current += step
      if (current < target) {
        setValue(Math.floor(current))
        requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }
    requestAnimationFrame(tick)
  }, [started, target])
  return value
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const count = useCounter(value, started)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); obs.disconnect() }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className="lp-hover-card lp-reveal rounded-2xl p-6 text-center cursor-default" style={{ background: '#e6faf6' }}>
      <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#1dd3b0' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm" style={{ color: '#6b7280' }}>{label}</div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function LandingPage() {
  const navigate = useNavigate()
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [feishuOpen, setFeishuOpen] = useState(false)

  /* inject CSS once */
  useEffect(() => {
    const id = 'lp-styles'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = landingCSS
      document.head.appendChild(style)
    }
    return () => {
      const el = document.getElementById('lp-styles')
      el?.remove()
    }
  }, [])

  /* scroll reveal */
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active') }),
      { threshold: 0.1, rootMargin: '-40px' }
    )
    els.forEach(el => obs.observe(el))
    // trigger elements already in view
    setTimeout(() => els.forEach(el => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight) el.classList.add('active')
    }), 100)
    return () => obs.disconnect()
  }, [])

  /* navbar scroll */
  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 100) navRef.current.classList.add('lp-nav-scrolled')
        else navRef.current.classList.remove('lp-nav-scrolled')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const navLinks = [
    { label: '功能特性', id: 'features' },
    { label: '使用流程', id: 'how-it-works' },
    { label: '定价方案', id: 'pricing' },
    { label: '用户评价', id: 'testimonials' },
    { label: '专业团队', id: 'team' },
  ]

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#0a0a0a' }}>
      {feishuOpen && <FeishuModal onClose={() => setFeishuOpen(false)} />}

      {/* ── Navbar ── */}
      <header ref={navRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.3s', background: 'transparent' }}>
        <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/favicon.svg" alt="EasyApply" style={{ width: 40, height: 40 }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0a0a0a' }}>EasyApply</span>
            </a>

            {/* Desktop nav */}
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden md:flex">
              {navLinks.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#6b7280', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1dd3b0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div style={{ display: 'flex', gap: 12 }} className="hidden md:flex">
              <button onClick={() => navigate('/login')}
                style={{ padding: '10px 20px', border: '1px solid #1dd3b0', color: '#1dd3b0', background: 'transparent', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e6faf6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                登录
              </button>
              <button onClick={() => navigate('/register')}
                className="lp-gradient-btn"
                style={{ padding: '10px 20px', border: 'none', color: 'white', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                注册
              </button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(v => !v)} className="md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div style={{ padding: '16px 0', borderTop: '1px solid #e5e7eb', background: 'white' }}>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 0', background: 'none', border: 'none', fontSize: 16, fontWeight: 500, color: '#6b7280', cursor: 'pointer' }}>
                  {l.label}
                </button>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button onClick={() => navigate('/login')}
                  style={{ flex: 1, padding: '10px 0', border: '1px solid #1dd3b0', color: '#1dd3b0', background: 'transparent', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  登录
                </button>
                <button onClick={() => navigate('/register')}
                  className="lp-gradient-btn"
                  style={{ flex: 1, padding: '10px 0', border: 'none', color: 'white', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  注册
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', paddingTop: 128, paddingBottom: 0, overflow: 'hidden', background: 'white' }}>
        <div className="lp-float" style={{ position: 'absolute', top: 80, left: 40, width: 288, height: 288, borderRadius: '50%', background: 'rgba(29,211,176,0.1)', filter: 'blur(60px)' }} />
        <div className="lp-float2" style={{ position: 'absolute', bottom: 80, right: 40, width: 384, height: 384, borderRadius: '50%', background: 'rgba(167,139,250,0.1)', filter: 'blur(60px)' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', maxWidth: 896, margin: '0 auto' }}>
            <div className="lp-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#e6faf6', borderRadius: 999, marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1dd3b0', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0a0a0a' }}>智能留学申请平台 · 已帮助 10,000+ 学生</span>
            </div>

            <h1 className="lp-reveal" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 24, transitionDelay: '0.1s' }}>
              <span style={{ color: '#0a0a0a' }}>让留学申请</span><br />
              <span className="lp-gradient-text">简单、高效、精准</span>
            </h1>

            <p className="lp-reveal" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#6b7280', maxWidth: 672, margin: '0 auto 40px', transitionDelay: '0.2s' }}>
              从选校到录取，AI助手全程陪伴。基于50万+真实录取数据，科学规划你的申请之路
            </p>

            <div className="lp-reveal" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 32, transitionDelay: '0.3s' }}>
              <button onClick={() => navigate('/onboarding')} className="lp-hero-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 32px', color: 'white', fontWeight: 600, borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: '0 8px 20px rgba(29,211,176,0.3)' }}>
                免费开始使用 <ArrowRight size={20} />
              </button>
              <button className="lp-hero-btn-secondary" onClick={() => setFeishuOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: 'white', color: '#0a0a0a', fontWeight: 600, borderRadius: 999, border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 16 }}>
                <Play size={20} color="#1dd3b0" /> 了解更多
              </button>
            </div>

            <div className="lp-reveal" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24, transitionDelay: '0.4s' }}>
              {['永久免费基础版', '银行级数据加密', '5分钟快速上手'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280' }}>
                  <CheckCircle size={16} color="#1dd3b0" /> <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Showcase ── */}
      <section style={{ paddingTop: 32, paddingBottom: 64, background: 'white' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="lp-reveal" style={{ marginBottom: 64 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.12)' }}>
              <img src="/dashboard.jpg" alt="EduPath Dashboard" style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="lg:grid-cols-4">
            <StatCard value={35} suffix="%" label="录取概率提升" />
            <StatCard value={500} suffix="+" label="覆盖顶尖院校" />
            <StatCard value={50000} suffix="+" label="已生成文书" />
            <StatCard value={92} suffix="%" label="申请成功率" />
          </div>
        </div>
      </section>

      {/* ── Logo Marquee ── */}
      <section style={{ padding: '64px 0', background: '#f5f5f5', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', marginBottom: 40 }}>
          <div className="lp-reveal" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.875rem)', fontWeight: 700, marginBottom: 12 }}>覆盖全球 500+ 顶尖院校</h2>
            <p style={{ color: '#6b7280' }}>数据来源官方可靠，持续更新</p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 128, background: 'linear-gradient(to right, #f5f5f5, transparent)', zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 128, background: 'linear-gradient(to left, #f5f5f5, transparent)', zIndex: 10 }} />

          <div className="lp-logo-marquee" style={{ gap: 24 }}>
            {[
              { name: '哈佛大学', abbr: 'H', img: '/logo-harvard.png' },
              { name: '斯坦福大学', abbr: 'S', img: '/logo-stanford.png' },
              { name: '麻省理工学院', abbr: 'M', img: '/logo-mit.png' },
              { name: '哥伦比亚大学', abbr: 'C', img: '/logo-columbia.png' },
              { name: '牛津大学', abbr: 'O', img: '/logo-oxford.png' },
              { name: '剑桥大学', abbr: 'C', img: '/logo-cambridge.png' },
              { name: '帝国理工学院', abbr: 'I', img: '/logo-imperial.png' },
              { name: '伦敦政治经济学院', abbr: 'L', img: '/logo-lse.png' },
              { name: '香港大学', abbr: 'H', img: '/logo-hku.png' },
              { name: '新加坡国立大学', abbr: 'N', img: '/logo-nus.png' },
              // duplicate for seamless loop
              { name: '哈佛大学', abbr: 'H', img: '/logo-harvard.png' },
              { name: '斯坦福大学', abbr: 'S', img: '/logo-stanford.png' },
              { name: '麻省理工学院', abbr: 'M', img: '/logo-mit.png' },
              { name: '哥伦比亚大学', abbr: 'C', img: '/logo-columbia.png' },
              { name: '牛津大学', abbr: 'O', img: '/logo-oxford.png' },
              { name: '剑桥大学', abbr: 'C', img: '/logo-cambridge.png' },
              { name: '帝国理工学院', abbr: 'I', img: '/logo-imperial.png' },
              { name: '伦敦政治经济学院', abbr: 'L', img: '/logo-lse.png' },
              { name: '香港大学', abbr: 'H', img: '/logo-hku.png' },
              { name: '新加坡国立大学', abbr: 'N', img: '/logo-nus.png' },
            ].map((u, i) => (
              <div key={i} style={{ flexShrink: 0, width: 200, height: 72, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <img src={u.img} alt={u.name} style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }}
                  onError={e => { const el = e.currentTarget; el.style.display = 'none'; const sib = el.nextElementSibling as HTMLElement; if (sib) sib.style.display = 'flex' }} />
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e6faf6', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: '#1dd3b0' }}>
                  {u.abbr}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features 4 Cards ── */}
      <section id="features" style={{ padding: '96px 0', background: 'white' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: 16 }}>四大核心功能，全方位助力申请</h2>
            <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 640, margin: '0 auto' }}>从选校规划到文书撰写，从材料管理到进度追踪，一站式解决所有申请难题</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: <MapPin size={28} color="#1dd3b0" />, title: '智能选校推荐', desc: 'AI驱动的精准选校系统，分析你的学术背景、标化成绩、活动经历，结合50万+历史录取数据，生成个性化院校推荐列表。' },
              { icon: <FileText size={28} color="#1dd3b0" />, title: 'AI文书助手', desc: '智能文书生成与优化，根据院校要求和个人背景，生成高质量申请文书。支持PS、推荐信、简历等多种文书类型。' },
              { icon: <FolderOpen size={28} color="#1dd3b0" />, title: '申请材料管理', desc: '所有申请资料集中管理，智能分类归档。简历、成绩单、推荐信、文书等材料一目了然，一键导出打包。' },
              { icon: <Calendar size={28} color="#1dd3b0" />, title: '申请进度追踪', desc: '可视化申请时间线，关键节点智能提醒。从准备材料到提交申请，每个步骤清晰可见，不再错过截止日期。' },
            ].map((f, i) => (
              <div key={i} className="lp-reveal lp-hover-card lp-feature-card"
                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, cursor: 'default', transitionDelay: `${0.1 * (i + 1)}s`, transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 40px rgba(29,211,176,0.1)'; e.currentTarget.style.borderColor = 'rgba(29,211,176,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#e5e7eb' }}>
                <div className="lp-feature-icon" style={{ width: 56, height: 56, borderRadius: 12, background: '#e6faf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Details ── */}
      <section style={{ padding: '96px 0', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          {[
            {
              reverse: false,
              tag: '告别盲目申请，让数据为你导航',
              title: 'AI 驱动的精准选校',
              desc: '我们的智能选校系统分析你的学术背景、标化成绩、活动经历，结合 50万+ 历史录取数据，为你生成个性化的院校推荐列表。',
              checks: ['多维度背景分析', '录取概率预测', '保底/匹配/冲刺分层', '实时数据更新'],
              img: '/feature-school-selection.jpg',
            },
            {
              reverse: true,
              tag: '将你的故事转化为打动招生官的文书',
              title: '智能文书写作助手',
              desc: '基于你填写的深度问卷和个人经历，AI 助手为你生成定制化的文书初稿。支持多种文书类型，并提供专业的润色功能。',
              checks: ['个性化文书生成', '多种文书模板', '专业润色优化', '查重与语法检查'],
              img: '/feature-essay.jpg',
            },
            {
              reverse: false,
              tag: '一站式管理你的所有申请',
              title: '全流程申请管理',
              desc: '从选校到提交，从等待录取，每一步都清晰可见。智能时间线帮你合理安排进度，材料清单确保万无一失。',
              checks: ['可视化申请进度', '智能 DDL 提醒', '材料版本管理', '多校申请同步'],
              img: '/feature-tracking.jpg',
            },
            {
              reverse: true,
              tag: '所有申请资料一目了然',
              title: '材料文书整合归纳',
              desc: '将你的简历、成绩单、推荐信、文书等所有材料集中管理。智能分类归档，一键导出，让申请材料井然有序。',
              checks: ['智能材料分类', '文书版本追踪', '一键打包导出', '云端安全存储'],
              img: '/feature-documents.jpg',
            },
          ].map((item, i) => (
            <div key={i} className="lp-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: i < 3 ? 96 : 0 }}>
              <div style={{ order: item.reverse ? 2 : 1 }}>
                <span style={{ color: '#1dd3b0', fontWeight: 500, fontSize: 14, display: 'block', marginBottom: 12, transition: 'transform 0.25s ease', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {item.tag}
                </span>
                <h3 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 700, marginBottom: 24, transition: 'transform 0.25s ease', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {item.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: 18, lineHeight: 1.7, marginBottom: 32, transition: 'transform 0.25s ease', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {item.desc}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {item.checks.map(c => (
                    <li key={c} style={{ display: 'flex', alignItems: 'center', gap: 12, transition: 'transform 0.25s ease', cursor: 'default' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1dd3b0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={14} color="white" />
                      </div>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ order: item.reverse ? 1 : 2, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <img src={item.img} alt={item.title} style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.5s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: '96px 0', background: '#e6faf6' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: 16 }}>三步开启申请之旅</h2>
            <p style={{ fontSize: 18, color: '#6b7280' }}>简单上手，快速开始</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              { icon: <UserPlus size={40} color="#1dd3b0" />, num: '01', title: '快速注册评估', desc: '填写基本学术背景，AI即刻为你生成初步评估报告和选校建议' },
              { icon: <Target size={40} color="#1dd3b0" />, num: '02', title: '制定申请策略', desc: '根据评估结果，获取个性化申请方案，包括选校清单、时间规划、文书策略' },
              { icon: <Rocket size={40} color="#1dd3b0" />, num: '03', title: '高效执行申请', desc: '使用AI工具完成文书撰写，管理申请材料，追踪申请进度直至收获Offer' },
            ].map((step, i) => (
              <div key={i} className="lp-reveal" style={{ textAlign: 'center', transitionDelay: `${0.1 * (i + 1)}s` }}>
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginBottom: 24 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 16, background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                    {step.icon}
                  </div>
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 32, height: 32, borderRadius: '50%', background: '#1dd3b0', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {step.num}
                  </div>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{step.title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="lp-reveal" style={{ textAlign: 'center', marginTop: 64, transitionDelay: '0.4s' }}>
            <button onClick={() => navigate('/onboarding')} className="lp-gradient-btn"
              style={{ padding: '16px 32px', border: 'none', color: 'white', fontWeight: 600, borderRadius: 999, cursor: 'pointer', fontSize: 16, boxShadow: '0 8px 20px rgba(29,211,176,0.3)' }}>
              立即开始体验
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '96px 0', background: 'white' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: 16 }}>选择适合你的方案</h2>
            <p style={{ fontSize: 18, color: '#6b7280' }}>从免费基础版到专业版，满足不同需求</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, maxWidth: 1024, margin: '0 auto', alignItems: 'start' }}>
            {[
              {
                name: '免费版', desc: '适合初次体验的用户', price: '0',
                features: ['基础选校评估', '3所院校推荐', '文书模板下载', '邮件支持'],
                cta: '免费开始', highlight: false,
              },
              {
                name: '专业版', desc: '适合认真申请的学生', price: '99',
                features: ['高级选校算法', '无限院校推荐', 'AI文书助手', '材料管理系统', '进度追踪', '优先客服支持'],
                cta: '立即升级', highlight: true,
              },
              {
                name: '旗舰版', desc: '追求极致申请体验', price: '199',
                features: ['全部专业版功能', '1对1顾问咨询', '文书精修服务', '面试辅导', '专属申请策略', 'VIP客服通道'],
                cta: '联系销售', highlight: false,
              },
            ].map((plan, i) => (
              <div key={i} className="lp-reveal lp-hover-card"
                style={{
                  background: 'white', border: plan.highlight ? '2px solid #1dd3b0' : '1px solid #e5e7eb',
                  borderRadius: 16, padding: 32, position: 'relative',
                  transform: plan.highlight ? 'scale(1.04)' : undefined,
                  boxShadow: plan.highlight ? '0 20px 40px rgba(29,211,176,0.12)' : undefined,
                  transitionDelay: `${0.1 * (i + 1)}s`,
                }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: '#1dd3b0', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 999 }}>
                    最受欢迎
                  </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>{plan.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <span style={{ color: '#6b7280' }}>¥</span>
                    <span style={{ fontSize: 40, fontWeight: 700 }}>{plan.price}</span>
                    <span style={{ color: '#6b7280' }}>/月</span>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#6b7280' }}>
                      <Check size={20} color="#1dd3b0" style={{ flexShrink: 0 }} /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => plan.cta === '免费开始' ? navigate('/onboarding') : setFeishuOpen(true)}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 999, fontWeight: 600, cursor: 'pointer', fontSize: 16, border: 'none',
                    ...(plan.highlight
                      ? { background: 'linear-gradient(135deg, #1dd3b0, #10b981)', color: 'white', boxShadow: '0 8px 20px rgba(29,211,176,0.3)' }
                      : { background: '#f5f5f5', color: '#0a0a0a' })
                  }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '96px 0', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: 16 }}>听听他们怎么说</h2>
            <p style={{ fontSize: 18, color: '#6b7280' }}>来自全球学生的真实反馈</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { text: '"EasyApply的AI选校功能太强大了！它推荐的冲刺校、匹配校、保底校非常精准，最终我真的拿到了哥大的Offer！"', name: '张同学', school: '录取：哥伦比亚大学', char: '张' },
              { text: '"文书助手帮我节省了大量时间，生成的初稿质量很高，经过简单修改就能直接使用。强烈推荐！"', name: '李同学', school: '录取：伦敦政治经济学院', char: '李' },
              { text: '"申请进度追踪功能让我不再焦虑，每个关键节点都有提醒，整个申请过程井然有序。"', name: '王同学', school: '录取：新加坡国立大学', char: '王' },
            ].map((t, i) => (
              <div key={i} className="lp-reveal lp-hover-card"
                style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transitionDelay: `${0.1 * (i + 1)}s` }}>
                <Quote size={40} color="rgba(29,211,176,0.2)" style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={20} fill="#facc15" color="#facc15" />)}
                </div>
                <p style={{ color: '#0a0a0a', lineHeight: 1.7, marginBottom: 24 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6faf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#1dd3b0' }}>
                    {t.char}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 14, color: '#1dd3b0' }}>{t.school}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section id="team" style={{ padding: '96px 0', background: 'white' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: 16 }}>专业团队</h2>
            <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 640, margin: '0 auto' }}>来自顶尖院校的资深顾问，为你提供最专业的申请指导</p>
          </div>

          <div className="lp-reveal" style={{ marginBottom: 64, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <img src="/team.jpg" alt="专业团队" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          <div className="lp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center', marginBottom: 64, transitionDelay: '0.2s' }}>
            {[
              { val: '50+', label: '资深顾问' },
              { val: '10年+', label: '平均从业经验' },
              { val: '100%', label: '顶尖院校背景' },
              { val: '24h', label: '快速响应' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#1dd3b0', marginBottom: 8 }}>{s.val}</div>
                <div style={{ color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="lp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, transitionDelay: '0.3s' }}>
            {[
              { icon: <GraduationCap size={32} color="white" />, title: '名校背景', desc: '所有顾问均毕业于哈佛、斯坦福、牛津等世界顶尖院校' },
              { icon: <Award size={32} color="white" />, title: '丰富经验', desc: '平均10年以上留学申请经验，累计帮助5000+学生成功录取' },
              { icon: <MessageCircle size={32} color="white" />, title: '1对1服务', desc: '专属顾问全程跟进，从规划到录取提供个性化指导' },
            ].map((c, i) => (
              <div key={i} className="lp-hover-card" style={{ background: '#e6faf6', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: '#1dd3b0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  {c.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{c.title}</h3>
                <p style={{ color: '#6b7280' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
        <div className="lp-cta-bg" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', top: 40, left: 40, width: 128, height: 128, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)' }} />
        <div style={{ position: 'absolute', bottom: 40, right: 40, width: 192, height: 192, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)' }} />
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
          <div className="lp-reveal" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 5vw, 3rem)', fontWeight: 700, color: 'white', marginBottom: 24 }}>准备好开始你的留学之旅了吗？</h2>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 40 }}>加入10,000+学生，用AI让申请更简单</p>
            <button onClick={() => navigate('/onboarding')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: 'white', color: '#1dd3b0', fontWeight: 600, borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'box-shadow 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)')}>
              免费开始使用 <ArrowRight size={20} />
            </button>
            <p style={{ marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>无需信用卡 · 永久免费基础版</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0a0a0a', color: 'white', padding: '64px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
            <div>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
                <img src="/favicon.svg" alt="EasyApply" style={{ width: 40, height: 40 }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>EasyApply</span>
              </a>
              <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>AI驱动的智能留学申请平台，让留学申请更简单、高效、精准。</p>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 16 }}>产品</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['功能特性', 'features'], ['定价方案', 'pricing'], ['使用流程', 'how-it-works'], ['用户评价', 'testimonials']].map(([label, id]) => (
                  <li key={id}><button onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1dd3b0')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>{label}</button></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 16 }}>资源</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['帮助中心', '博客', '申请指南', '常见问题'].map(t => (
                  <li key={t}><span style={{ color: '#9ca3af', fontSize: 14 }}>{t}</span></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 16 }}>联系我们</h4>
              <div style={{ display: 'flex', gap: 12 }}>
                {[<Link size={20} />, <ExternalLink size={20} />, <Globe size={20} />, <Mail size={20} />].map((icon, i) => (
                  <div key={i} style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1dd3b0')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>© 2026 EasyApply. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#9ca3af' }}>
              {['隐私政策', '服务条款'].map(t => (
                <span key={t} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1dd3b0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
