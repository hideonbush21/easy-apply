import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecommendations } from '@/api/schools'
import { createApplication } from '@/api/applications'
import type { School } from '@/types'
import { Plus, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

type Category = 'reach' | 'match' | 'safety'

const CATEGORY_CONFIG: Record<Category, {
  label: string
  headerCls: string
  badgeVariant: 'danger' | 'primary' | 'success'
  desc: string
  priority: string
}> = {
  reach:  { label: '冲刺', headerCls: 'bg-rose-500/10 border-rose-500/20',     badgeVariant: 'danger',  desc: '匹配度 50-70%，有挑战性', priority: '冲刺' },
  match:  { label: '匹配', headerCls: 'bg-violet-500/10 border-violet-500/20', badgeVariant: 'primary', desc: '匹配度 70-85%，较为合适', priority: '匹配' },
  safety: { label: '保底', headerCls: 'bg-emerald-500/10 border-emerald-500/20', badgeVariant: 'success', desc: '匹配度 >85%，把握较大', priority: '保底' },
}

export default function RecommendationsPage() {
  const [data, setData] = useState<Record<Category, School[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    getRecommendations()
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || '获取推荐失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (school: School, cat: Category) => {
    try {
      await createApplication({
        school_id: school.id,
        priority: CATEGORY_CONFIG[cat].priority,
        application_deadline: school.application_deadline || undefined,
      })
      setAdded(prev => new Set([...prev, school.id]))
    } catch {
      alert('添加失败')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
      <Spinner /> <span className="text-sm">正在计算推荐...</span>
    </div>
  )

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">智能推荐</h2>
        <p className="text-slate-400 text-sm mt-1">根据你的档案信息，为你推荐合适的院校</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
          {error}。请先完善档案信息（GPA、目标国家、目标专业）。
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {(['reach', 'match', 'safety'] as Category[]).map(cat => {
          const config = CATEGORY_CONFIG[cat]
          const schools = data?.[cat] || []
          return (
            <div key={cat}>
              <div className={`rounded-xl border p-4 mb-3 ${config.headerCls}`}>
                <div className="flex items-center justify-between">
                  <Badge variant={config.badgeVariant}>{config.label}</Badge>
                  <span className="text-xs text-slate-500 tabular-nums">{schools.length} 所</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{config.desc}</p>
              </div>

              <div className="space-y-3">
                {schools.length === 0 ? (
                  <EmptyState title="暂无推荐" className="py-8" />
                ) : (
                  schools.map(school => (
                    <Card key={school.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-white text-sm">{school.name_cn || school.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{school.country} · <span className="tabular-nums">#{school.ranking}</span></p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 shrink-0 ml-2">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-medium tabular-nums">{school.match_score}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <Link
                          to={`/schools/${school.id}`}
                          className="text-xs font-medium text-violet-400 hover:text-violet-300"
                        >
                          查看详情
                        </Link>
                        <Button
                          size="sm"
                          variant={added.has(school.id) ? 'secondary' : 'primary'}
                          onClick={() => handleAdd(school, cat)}
                          disabled={added.has(school.id)}
                          className="text-xs"
                        >
                          <Plus size={11} />
                          {added.has(school.id) ? '已添加' : '申请'}
                        </Button>
                      </div>
                    </Card>
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
