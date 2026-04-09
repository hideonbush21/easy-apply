import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfileBasedRecommendation, type RecommendedSchool, type RecommendedProgram } from '@/api/schools'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, ExternalLink, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const MATCH_LEVEL_LABEL: Record<string, string> = {
  exact:       '精确匹配',
  'widened_0.5': '扩大匹配 (±0.5 GPA)',
  'widened_0.8': '扩大匹配 (±0.8 GPA)',
  no_major:    '忽略专业匹配',
}

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ schools: RecommendedSchool[]; match_level: string; total_cases_found: number; category: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await getProfileBasedRecommendation({ top_schools: 8, top_programs: 3 })
      setResult(r.data)
      // 默认展开所有学校
      setExpanded(new Set(r.data.schools.map((_, i) => i)))
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || '生成失败，请检查档案是否完整后重试')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div className="p-8 max-w-4xl" style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>智能推荐</h2>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            基于历史录取案例 + AI 语义匹配，为你推荐最适合的院校和项目
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? <Spinner /> : result ? <RefreshCw size={14} /> : <Sparkles size={14} />}
          {loading ? '生成中…' : result ? '重新生成' : '生成推荐'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <AlertTriangle size={15} style={{ color: '#d97706', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#92400e' }}>无法生成推荐</p>
            <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>{error}</p>
            <Link to="/dashboard/profile" className="text-xs font-semibold mt-1 inline-block" style={{ color: '#d97706' }}>
              前往完善档案 →
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: '#9ca3af' }}>
          <Sparkles size={40} style={{ color: '#1dd3b0' }} />
          <p className="text-sm font-medium" style={{ color: '#374151' }}>点击「生成推荐」开始智能选校</p>
          <p className="text-xs text-center max-w-xs" style={{ color: '#9ca3af' }}>
            系统将基于与你背景相似的历史录取案例，结合 AI 语义匹配，推荐最适合你的项目
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: '#6b7280' }}>
          <Spinner />
          <p className="text-sm">AI 正在分析历史案例，匹配最适合你的项目…</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Meta info */}
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <Badge variant="primary">{MATCH_LEVEL_LABEL[result.match_level] ?? result.match_level}</Badge>
            <span className="text-xs" style={{ color: '#6b7280' }}>
              参考了 <strong>{result.total_cases_found}</strong> 条相似录取案例
            </span>
            {result.category && (
              <span className="text-xs" style={{ color: '#6b7280' }}>· 专业大类：{result.category}</span>
            )}
          </div>

          {/* School list */}
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
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SchoolCard({ school, idx, expanded, onToggle }: {
  school: RecommendedSchool
  idx: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <Card>
      {/* School header */}
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
          {school.avg_gpa && (
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

      {/* Programs */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          {school.programs.length === 0 ? (
            <p className="px-5 py-4 text-sm" style={{ color: '#9ca3af' }}>暂无匹配项目数据</p>
          ) : (
            school.programs.map((prog, pi) => (
              <ProgramRow key={prog.id} program={prog} isLast={pi === school.programs.length - 1} />
            ))
          )}
        </div>
      )}
    </Card>
  )
}

function ProgramRow({ program, isLast }: { program: RecommendedProgram; isLast: boolean }) {
  const score = Math.round(program.similarity_score * 100)
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
      {program.program_url && (
        <a href={program.program_url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs font-medium"
          style={{ color: '#1dd3b0' }}>
          官网 <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}
