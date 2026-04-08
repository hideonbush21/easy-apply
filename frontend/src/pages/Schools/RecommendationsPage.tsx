import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRecommendations } from '@/api/schools'
import { createApplication } from '@/api/applications'
import type { School } from '@/types'
import { Star, Plus, ArrowLeft, AlertTriangle } from 'lucide-react'

type Category = 'reach' | 'match' | 'safety'

const CATEGORY_CONFIG: Record<Category, {
  label: string; desc: string; priority: string
  bg: string; border: string; badgeColor: string; badgeBg: string
}> = {
  reach:  { label: '冲刺', desc: '匹配度 50-70%，有挑战性', priority: '冲刺', bg: '#fff1f2', border: '#fecdd3', badgeColor: '#e11d48', badgeBg: '#fff1f2' },
  match:  { label: '匹配', desc: '匹配度 70-85%，较为合适', priority: '匹配', bg: '#f5f3ff', border: '#ddd6fe', badgeColor: '#7c3aed', badgeBg: '#f5f3ff' },
  safety: { label: '保底', desc: '匹配度 >85%，把握较大',  priority: '保底', bg: '#e6faf6', border: '#a7f3d0', badgeColor: '#059669', badgeBg: '#e6faf6' },
}

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const [data, setData]     = useState<Record<Category, School[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [added, setAdded]   = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    getRecommendations()
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || '获取推荐失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (school: School, cat: Category) => {
    setAdding(school.id)
    try {
      await createApplication({
        school_id: school.id,
        priority: CATEGORY_CONFIG[cat].priority,
        application_deadline: school.application_deadline || undefined,
      })
      setAdded(prev => new Set([...prev, school.id]))
    } catch {
      alert('添加失败，请重试')
    } finally {
      setAdding(null)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 10 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#1dd3b0', borderRadius: '50%', animation: 'rec-spin 0.9s linear infinite' }} />
      <span style={{ fontSize: 14, color: '#6b7280' }}>正在计算推荐…</span>
      <style>{`@keyframes rec-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', animation: 'fade-in 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)', marginBottom: 6 }}>智能推荐</h2>
        <p style={{ fontSize: 13, color: '#6b7280' }}>根据你的档案信息，为你推荐合适的院校</p>
      </div>

      {/* Error / incomplete profile prompt */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, padding: '14px 16px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12 }}>
          <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>需要完善档案信息</p>
            <p style={{ fontSize: 12, color: '#b45309' }}>{error}。请补充 GPA、目标国家、目标专业后再生成推荐。</p>
            <button
              onClick={() => navigate('/dashboard/profile')}
              style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft size={12} /> 前往完善档案
            </button>
          </div>
        </div>
      )}

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {(['reach', 'match', 'safety'] as Category[]).map(cat => {
          const cfg = CATEGORY_CONFIG[cat]
          const schools = data?.[cat] || []
          return (
            <div key={cat}>
              {/* Column header */}
              <div style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.badgeColor, background: cfg.badgeBg, border: `1px solid ${cfg.border}`, padding: '3px 10px', borderRadius: 999 }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{schools.length} 所</span>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{cfg.desc}</p>
              </div>

              {/* School cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {schools.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0', fontSize: 13, color: '#9ca3af', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12 }}>
                    暂无推荐
                  </div>
                ) : (
                  schools.map(school => (
                    <div key={school.id} style={{
                      background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12,
                      padding: '14px 16px', transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1dd3b0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(29,211,176,0.1)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                    >
                      {/* School info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>
                            {school.name_cn || school.name}
                          </p>
                          <p style={{ fontSize: 12, color: '#6b7280' }}>
                            {school.country} · <span style={{ fontFamily: 'var(--font-mono)' }}>#{school.ranking}</span>
                          </p>
                        </div>
                        {school.match_score != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                              {school.match_score}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                        <Link
                          to={`/dashboard/schools/${school.id}`}
                          style={{ fontSize: 12, fontWeight: 600, color: '#1dd3b0', textDecoration: 'none' }}
                        >
                          查看详情 →
                        </Link>
                        <button
                          disabled={added.has(school.id) || adding === school.id}
                          onClick={() => handleAdd(school, cat)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 14px', borderRadius: 8, border: 'none',
                            fontSize: 12, fontWeight: 600, cursor: added.has(school.id) ? 'default' : 'pointer',
                            background: added.has(school.id) ? '#f3f4f6' : 'linear-gradient(135deg,#1dd3b0,#10b981)',
                            color: added.has(school.id) ? '#9ca3af' : '#fff',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Plus size={11} />
                          {added.has(school.id) ? '已添加' : adding === school.id ? '添加中…' : '加入申请'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
