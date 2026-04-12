import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  getProfileBasedRecommendation,
  getMyRecommendation,
  type RecommendedSchool,
  type RecommendedProgram,
  type ProfileBasedResult,
} from '@/api/schools'
import { createApplication, getApplications } from '@/api/applications'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Plus, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

type PageStatus = 'loading' | 'none' | 'fresh' | 'stale' | 'generating' | 'error'

// Priority thresholds — must stay in sync with ProgramRow handleAdd logic
export const PRIORITY_TIERS = [
  {
    label: '冲刺',
    desc: '匹配度 ≥ 80%',
    detail: '录取把握较小，属于拔高选择',
    bg: '#fff1f2', color: '#be123c', border: '#fecdd3',
    threshold: 0.8,
  },
  {
    label: '匹配',
    desc: '匹配度 60–79%',
    detail: '背景与项目要求高度契合',
    bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe',
    threshold: 0.6,
  },
  {
    label: '保底',
    desc: '匹配度 < 60%',
    detail: '录取概率较高，稳妥之选',
    bg: '#f0fdf4', color: '#166534', border: '#bbf7d0',
    threshold: 0,
  },
]

function getPriorityTier(score: number) {
  if (score >= 0.8) return PRIORITY_TIERS[0]
  if (score >= 0.6) return PRIORITY_TIERS[1]
  return PRIORITY_TIERS[2]
}

const MATCH_LEVEL_LABEL: Record<string, string> = {
  exact:         '精确匹配',
  'widened_0.5': '扩大匹配 (±0.5 GPA)',
  'widened_0.8': '扩大匹配 (±0.8 GPA)',
  no_major:      '忽略专业匹配',
}

export default function RecommendationsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<PageStatus>('loading')
  const [result, setResult] = useState<ProfileBasedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  // 已加入申请的 program_id 集合
  const [addedPrograms, setAddedPrograms] = useState<Set<string>>(new Set())

  // 加载缓存结果
  const loadCached = async () => {
    try {
      const r = await getMyRecommendation()
      if (r.data.status === 'none') {
        setStatus('none')
      } else {
        setResult(r.data.data!)
        setExpanded(new Set((r.data.data?.schools ?? []).map((_, i) => i)))
        setStatus(r.data.status) // 'fresh' | 'stale'
      }
    } catch {
      setStatus('none')
    }
  }

  // 生成推荐
  const handleGenerate = async () => {
    setStatus('generating')
    setError(null)
    try {
      const r = await getProfileBasedRecommendation({ top_schools: 8, top_programs: 3 })
      setResult(r.data)
      setExpanded(new Set(r.data.schools.map((_, i) => i)))
      setStatus('fresh')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || '生成失败，请检查档案是否完整后重试')
      setStatus(result ? 'stale' : 'error')
    }
  }

  useEffect(() => {
    // 页面挂载时同步拉取已有申请，预填已加入状态
    getApplications()
      .then(r => {
        const ids = new Set(r.data.map((a: { program_id?: string | null }) => a.program_id).filter(Boolean) as string[])
        setAddedPrograms(ids)
      })
      .catch(() => null)

    const stateAutoGenerate = (location.state as { autoGenerate?: boolean })?.autoGenerate
    const queryAutoGenerate = new URLSearchParams(window.location.search).get('autoGenerate') === 'true'
    if (stateAutoGenerate || queryAutoGenerate) {
      handleGenerate()
    } else {
      loadCached()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  // ── 渲染 ────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-24 gap-2" style={{ color: '#6b7280' }}>
        <Spinner /> <span className="text-sm">加载中...</span>
      </div>
    )
  }

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>智能推荐</h2>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            基于历史录取案例 + AI 语义匹配，为你推荐最适合的院校和项目
          </p>
        </div>
        {(status === 'fresh' || status === 'stale') && (
          <Button onClick={handleGenerate}>
            <RefreshCw size={14} />
            重新生成
          </Button>
        )}
      </div>

      {/* Stale banner */}
      {status === 'stale' && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <AlertTriangle size={15} style={{ color: '#d97706', marginTop: 1, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: '#92400e' }}>检测到档案已更新</p>
            <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
              以下推荐结果基于旧档案数据，点击「重新生成」获取最新推荐
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="text-xs font-semibold shrink-0"
            style={{ color: '#d97706' }}
          >
            重新生成 →
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border"
          style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
          <AlertTriangle size={15} style={{ color: '#e11d48', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#9f1239' }}>生成失败</p>
            <p className="text-xs mt-0.5" style={{ color: '#be123c' }}>{error}</p>
            <Link to="/dashboard/profile" className="text-xs font-semibold mt-1 inline-block" style={{ color: '#e11d48' }}>
              前往完善档案 →
            </Link>
          </div>
        </div>
      )}

      {/* Generating */}
      {status === 'generating' && (
        <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: '#6b7280' }}>
          <Spinner />
          <p className="text-sm">AI 正在分析历史案例，匹配最适合你的项目…</p>
          <p className="text-xs" style={{ color: '#9ca3af' }}>通常需要 10-20 秒</p>
        </div>
      )}

      {/* None / Error with no data */}
      {(status === 'none' || status === 'error') && !result && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Sparkles size={40} style={{ color: '#1dd3b0' }} />
          <p className="text-sm font-medium" style={{ color: '#374151' }}>点击「生成推荐」开始智能选校</p>
          <p className="text-xs text-center max-w-xs" style={{ color: '#9ca3af' }}>
            系统将基于与你背景相似的历史录取案例，结合 AI 语义匹配，推荐最适合你的项目
          </p>
          <Button onClick={handleGenerate}>
            <Sparkles size={14} />
            生成推荐
          </Button>
        </div>
      )}

      {/* Results */}
      {result && status !== 'generating' && (
        <>
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <Badge variant="primary">{MATCH_LEVEL_LABEL[result.match_level] ?? result.match_level}</Badge>
            <span className="text-xs" style={{ color: '#6b7280' }}>
              参考了 <strong>{result.total_cases_found}</strong> 条相似录取案例
            </span>
            {result.category && (
              <span className="text-xs" style={{ color: '#6b7280' }}>· 专业大类：{result.category}</span>
            )}
          </div>

          {/* Priority legend */}
          <div className="mb-6 flex items-stretch gap-3 flex-wrap">
            {PRIORITY_TIERS.map(tier => (
              <div key={tier.label}
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl flex-1 min-w-[160px]"
                style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0"
                  style={{ background: tier.color, color: '#fff' }}>
                  {tier.label}
                </span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: tier.color }}>{tier.desc}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: tier.color, opacity: 0.75 }}>{tier.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {result.schools.length === 0 ? (
              <div className="text-center py-16 text-sm" style={{ color: '#9ca3af' }}>
                暂无匹配的推荐结果，建议完善档案后重新生成
              </div>
            ) : (
              result.schools.map((school, idx) => (
                <SchoolCard
                  key={idx}
                  school={school}
                  idx={idx}
                  expanded={expanded.has(idx)}
                  onToggle={() => toggleExpand(idx)}
                  addedPrograms={addedPrograms}
                  onAdd={(programId) => setAddedPrograms(prev => new Set([...prev, programId]))}
                  onViewApplications={() => navigate('/dashboard/applications')}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SchoolCard({ school, idx, expanded, onToggle, addedPrograms, onAdd, onViewApplications }: {
  school: RecommendedSchool
  idx: number
  expanded: boolean
  onToggle: () => void
  addedPrograms: Set<string>
  onAdd: (programId: string) => void
  onViewApplications: () => void
}) {
  return (
    <Card>
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#f0fdf9', color: '#1dd3b0' }}>
            {idx + 1}
          </span>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#111827' }}>
              {school.school_name_cn || school.school_name_en}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              {school.school_name_en}
              {school.ranking && <span className="ml-2">· QS #{school.ranking}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="text-right">
            <p className="text-xs" style={{ color: '#6b7280' }}>相似案例</p>
            <p className="text-sm font-semibold" style={{ color: '#111827' }}>{school.case_count} 条</p>
          </div>
          {school.avg_gpa != null && (
            <div className="text-right">
              <p className="text-xs" style={{ color: '#6b7280' }}>案例均 GPA</p>
              <p className="text-sm font-semibold" style={{ color: '#111827' }}>{school.avg_gpa}</p>
            </div>
          )}
          {expanded
            ? <ChevronUp size={16} style={{ color: '#9ca3af' }} />
            : <ChevronDown size={16} style={{ color: '#9ca3af' }} />
          }
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          {school.programs.length === 0 ? (
            <p className="px-5 py-4 text-sm" style={{ color: '#9ca3af' }}>暂无匹配项目数据</p>
          ) : (
            school.programs.map((prog, pi) => (
              <ProgramRow
                key={prog.id}
                program={prog}
                isLast={pi === school.programs.length - 1}
                added={addedPrograms.has(prog.id)}
                onAdd={onAdd}
                onViewApplications={onViewApplications}
              />
            ))
          )}
        </div>
      )}
    </Card>
  )
}

function ProgramRow({ program, isLast, added, onAdd, onViewApplications }: {
  program: RecommendedProgram
  isLast: boolean
  added: boolean
  onAdd: (programId: string) => void
  onViewApplications: () => void
}) {
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    setAdding(true)
    const priority = program.similarity_score >= 0.8 ? '冲刺' : program.similarity_score >= 0.6 ? '匹配' : '保底'
    try {
      await createApplication({ program_id: program.id, priority })
      onAdd(program.id)
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        // 已存在，标记为已添加
        onAdd(program.id)
      }
    } finally {
      setAdding(false)
    }
  }

  const score = Math.round(program.similarity_score * 100)
  const tier = getPriorityTier(program.similarity_score)
  const ielts = program.ielts_requirement
    ? (typeof program.ielts_requirement === 'object' ? program.ielts_requirement.total : program.ielts_requirement)
    : null
  const toefl = program.toefl_requirement
    ? (typeof program.toefl_requirement === 'object' ? program.toefl_requirement.total : program.toefl_requirement)
    : null
  const deadline = program.deadline_26fall || program.deadline_25fall

  return (
    <div className="px-5 py-3.5 flex items-start justify-between gap-4"
      style={{ borderBottom: isLast ? 'none' : '1px solid #f9fafb' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-sm font-medium" style={{ color: '#111827' }}>
            {program.name_cn || program.name_en}
          </p>
          {program.name_cn && program.name_en && (
            <span className="text-xs" style={{ color: '#9ca3af' }}>{program.name_en}</span>
          )}
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{ background: '#f0fdf9', color: '#1dd3b0' }}>
            匹配度 {score}%
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
            {tier.label}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: '#6b7280' }}>
          {program.department && <span>{program.department}</span>}
          {program.duration && <span>· {program.duration}</span>}
          {program.tuition_cny && <span>· 学费约 ¥{Number(program.tuition_cny).toLocaleString()}</span>}
          {ielts && <span>· 雅思 {ielts}</span>}
          {toefl && <span>· 托福 {toefl}</span>}
          {deadline && (
            <span style={{ color: '#d97706' }}>
              · 截止 {new Date(deadline).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      {/* 右侧操作区 */}
      <div className="shrink-0 flex items-center gap-2">
        {program.program_url && (
          <a href={program.program_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: '#1dd3b0' }}>
            官网 <ExternalLink size={11} />
          </a>
        )}
        {added ? (
          <button
            onClick={onViewApplications}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: '#f0fdf9', color: '#059669', border: '1px solid #a7f3d0' }}>
            <Check size={11} /> 已加入
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: '#1dd3b0', color: '#fff', border: 'none', cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}>
            <Plus size={11} /> {adding ? '加入中…' : '加入申请'}
          </button>
        )}
      </div>
    </div>
  )
}
