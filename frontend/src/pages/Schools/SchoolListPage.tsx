import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSchools } from '@/api/schools'
import type { School, PaginatedResponse } from '@/types'
import { Search, GraduationCap, MapPin, Trophy, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const COUNTRIES = ['', '英国', '美国', '澳大利亚', '香港', '新加坡']
const flagMap: Record<string, string> = {
  '英国': '🇬🇧', '美国': '🇺🇸', '澳大利亚': '🇦🇺', '香港': '🇭🇰', '新加坡': '🇸🇬',
}

export default function SchoolListPage() {
  const [data, setData]         = useState<PaginatedResponse<School> | null>(null)
  const [page, setPage]         = useState(1)
  const [country, setCountry]   = useState('')
  const [rankingMax, setRankingMax] = useState('')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    setLoading(true)
    getSchools({
      country: country || undefined,
      ranking_max: rankingMax ? Number(rankingMax) : undefined,
      page,
      per_page: 20,
    })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [country, rankingMax, page])

  const filtered = data?.schools.filter(s => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (s.name_cn || '').toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  }) ?? []

  return (
    <div style={{ padding: '28px 32px', animation: 'fade-in 0.3s ease-out', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-display)' }}>学校库</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          共收录{' '}
          <span style={{ color: '#1dd3b0', fontWeight: 600 }}>{data?.total ?? '—'}</span>
          {' '}所知名院校
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索学校名称..."
            style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#111827', background: '#fff', outline: 'none', width: 200 }}
            onFocus={e => e.target.style.borderColor = '#1dd3b0'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setPage(1) }}
          style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', outline: 'none', cursor: 'pointer' }}
        >
          {COUNTRIES.map(c => <option key={c} value={c}>{c || '全部国家'}</option>)}
        </select>
        <input
          type="number"
          value={rankingMax}
          onChange={e => { setRankingMax(e.target.value); setPage(1) }}
          placeholder="排名前 N"
          style={{ padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', outline: 'none', width: 110 }}
          onFocus={e => e.target.style.borderColor = '#1dd3b0'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 10 }}>
          <div style={{ width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#1dd3b0', borderRadius: '50%', animation: 'sl-spin 0.9s linear infinite' }} />
          <span style={{ fontSize: 14, color: '#6b7280' }}>加载中…</span>
          <style>{`@keyframes sl-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <GraduationCap size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
          <p style={{ color: '#9ca3af', fontSize: 14 }}>
            {data?.total === 0 ? '数据库暂无院校数据' : '暂无符合条件的学校'}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 100px 120px 130px 72px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Trophy size={12} />排名</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={12} />学校</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />国家</span>
              <span>GPA 要求</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />截止日期</span>
              <span></span>
            </div>

            {/* Data rows */}
            {filtered.map((school, i) => (
              <div
                key={school.id}
                style={{ display: 'grid', gridTemplateColumns: '72px 1fr 100px 120px 130px 72px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: school.ranking && school.ranking <= 50 ? '#1dd3b0' : '#6b7280' }}>
                  {school.ranking ? `#${school.ranking}` : '—'}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{school.name_cn || school.name}</div>
                  {school.name_cn && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{school.name}</div>}
                </div>
                <span style={{ fontSize: 13, color: '#374151' }}>{flagMap[school.country] || ''} {school.country}</span>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: '#374151', fontFamily: 'var(--font-mono)' }}>{school.gpa_requirement?.min ?? '—'}</span>
                  <span style={{ color: '#9ca3af', margin: '0 4px' }}>/</span>
                  <span style={{ color: '#1dd3b0', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{school.gpa_requirement?.preferred ?? '—'}</span>
                  <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 3 }}>推荐</span>
                </div>
                <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--font-mono)' }}>{school.application_deadline || '—'}</span>
                <Link
                  to={`/dashboard/schools/${school.id}`}
                  style={{ fontSize: 12, fontWeight: 600, color: '#1dd3b0', textDecoration: 'none', padding: '5px 12px', border: '1px solid #1dd3b0', borderRadius: 8, transition: 'all 0.15s', display: 'inline-block' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1dd3b0'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#1dd3b0' }}
                >
                  详情
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                共 {data.total} 所，第 {page} / {data.pages} 页
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151' }}
                >
                  <ChevronLeft size={14} /> 上一页
                </button>
                <button
                  disabled={page === data.pages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: page === data.pages ? 'not-allowed' : 'pointer', color: page === data.pages ? '#d1d5db' : '#374151' }}
                >
                  下一页 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
