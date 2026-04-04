import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSchool } from '@/api/schools'
import { createApplication } from '@/api/applications'
import type { School } from '@/types'
import { ChevronLeft, Plus } from 'lucide-react'

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [major, setMajor] = useState('')
  const [priority, setPriority] = useState('匹配')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    getSchool(id)
      .then(r => setSchool(r.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    if (!school) return
    setApplying(true)
    try {
      await createApplication({
        school_id: school.id,
        major: major || undefined,
        priority,
        application_deadline: school.application_deadline || undefined,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      alert('添加申请失败')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">加载中...</div>
  if (!school) return <div className="p-8 text-gray-500">学校不存在</div>

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft size={16} /> 返回
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{school.name_cn || school.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{school.name}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500">{school.country}</span>
              {school.ranking && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded font-medium">
                  全球排名 #{school.ranking}
                </span>
              )}
            </div>
          </div>
        </div>

        {school.description && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{school.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">GPA 要求</h3>
          <p className="text-sm text-gray-900">最低: <strong>{school.gpa_requirement.min}</strong></p>
          <p className="text-sm text-gray-900">推荐: <strong>{school.gpa_requirement.preferred}</strong></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">语言要求</h3>
          {school.language_requirement.toefl && (
            <p className="text-sm text-gray-900">托福: <strong>{school.language_requirement.toefl}</strong></p>
          )}
          {school.language_requirement.ielts && (
            <p className="text-sm text-gray-900">雅思: <strong>{school.language_requirement.ielts}</strong></p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">申请截止</h3>
          <p className="text-sm font-medium text-gray-900">{school.application_deadline || '请查询官网'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">开设专业</h3>
          <p className="text-sm text-gray-600">{school.majors?.slice(0, 5).join('、')}{school.majors?.length > 5 ? '...' : ''}</p>
        </div>
      </div>

      {/* Quick apply */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">快速添加申请</h3>
        {success && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            已成功添加到申请列表
          </div>
        )}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">申请专业</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={major}
              onChange={e => setMajor(e.target.value)}
            >
              <option value="">请选择专业</option>
              {school.majors?.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="冲刺">冲刺</option>
              <option value="匹配">匹配</option>
              <option value="保底">保底</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleApply}
          disabled={applying}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={16} />
          {applying ? '添加中...' : '添加到申请列表'}
        </button>
      </div>
    </div>
  )
}
