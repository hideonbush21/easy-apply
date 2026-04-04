import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecommendations } from '@/api/schools'
import { createApplication } from '@/api/applications'
import type { School } from '@/types'
import { Plus, Star } from 'lucide-react'

type Category = 'reach' | 'match' | 'safety'

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; badge: string; desc: string }> = {
  reach:  { label: '冲刺', color: 'border-red-200 bg-red-50',   badge: 'bg-red-100 text-red-700',   desc: '匹配度 50-70%，有挑战性' },
  match:  { label: '匹配', color: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-700', desc: '匹配度 70-85%，较为合适' },
  safety: { label: '保底', color: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-700', desc: '匹配度 >85%，把握较大' },
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
        priority: cat === 'reach' ? '冲刺' : cat === 'match' ? '匹配' : '保底',
        application_deadline: school.application_deadline || undefined,
      })
      setAdded(prev => new Set([...prev, school.id]))
    } catch {
      alert('添加失败')
    }
  }

  if (loading) return <div className="p-8 text-gray-400">正在计算推荐...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">智能推荐</h2>
        <p className="text-gray-500 text-sm mt-1">根据你的档案信息，为你推荐合适的院校</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          {error}。请先完善档案信息（GPA、目标国家、目标专业）。
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {(['reach', 'match', 'safety'] as Category[]).map(cat => {
          const config = CATEGORY_CONFIG[cat]
          const schools = data?.[cat] || []
          return (
            <div key={cat}>
              <div className={`rounded-xl border p-4 mb-3 ${config.color}`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.badge}`}>{config.label}</span>
                  <span className="text-xs text-gray-500">{schools.length} 所</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{config.desc}</p>
              </div>

              <div className="space-y-3">
                {schools.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">暂无推荐</p>
                ) : (
                  schools.map(school => (
                    <div key={school.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{school.name_cn || school.name}</p>
                          <p className="text-xs text-gray-400">{school.country} · #{school.ranking}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-medium">{school.match_score}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <Link
                          to={`/schools/${school.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          查看详情
                        </Link>
                        <button
                          onClick={() => handleAdd(school, cat)}                          disabled={added.has(school.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={11} />
                          {added.has(school.id) ? '已添加' : '申请'}
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
