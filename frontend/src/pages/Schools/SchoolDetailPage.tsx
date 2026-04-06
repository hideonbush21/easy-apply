import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSchool } from '@/api/schools'
import { createApplication } from '@/api/applications'
import type { School } from '@/types'
import { ChevronLeft, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

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

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
      <Spinner /> <span className="text-sm">加载中...</span>
    </div>
  )
  if (!school) return <div className="p-8 text-slate-500">学校不存在</div>

  return (
    <div className="p-8 max-w-3xl" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6 -ml-2"
      >
        <ChevronLeft size={16} /> 返回
      </Button>

      <Card className="mb-5">
        <Card.Body>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">{school.name_cn || school.name}</h2>
              <p className="text-slate-400 text-sm mt-1">{school.name}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm text-slate-500">{school.country}</span>
                {school.ranking && (
                  <Badge variant="amber">全球排名 #{school.ranking}</Badge>
                )}
              </div>
            </div>
          </div>
          {school.description && (
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">{school.description}</p>
          )}
        </Card.Body>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <Card>
          <Card.Body className="py-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">GPA 要求</h3>
            <p className="text-sm text-slate-200">最低: <strong className="text-white">{school.gpa_requirement.min}</strong></p>
            <p className="text-sm text-slate-200 mt-1">推荐: <strong className="text-white">{school.gpa_requirement.preferred}</strong></p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">语言要求</h3>
            {school.language_requirement.toefl && (
              <p className="text-sm text-slate-200">托福: <strong className="text-white">{school.language_requirement.toefl}</strong></p>
            )}
            {school.language_requirement.ielts && (
              <p className="text-sm text-slate-200 mt-1">雅思: <strong className="text-white">{school.language_requirement.ielts}</strong></p>
            )}
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">申请截止</h3>
            <p className="text-sm font-medium text-white tabular-nums">{school.application_deadline || '请查询官网'}</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">开设专业</h3>
            <p className="text-sm text-slate-300">{school.majors?.slice(0, 5).join('、')}{school.majors?.length > 5 ? '...' : ''}</p>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Body>
          <h3 className="font-semibold text-white mb-4">快速添加申请</h3>
          {success && (
            <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300">
              已成功添加到申请列表
            </div>
          )}
          <div className="flex gap-4 mb-4">
            <Select
              label="申请专业"
              value={major}
              onChange={e => setMajor(e.target.value)}
              className="flex-1"
            >
              <option value="">请选择专业</option>
              {school.majors?.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select
              label="优先级"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="冲刺">冲刺</option>
              <option value="匹配">匹配</option>
              <option value="保底">保底</option>
            </Select>
          </div>
          <Button onClick={handleApply} loading={applying}>
            <Plus size={16} />
            {applying ? '添加中...' : '添加到申请列表'}
          </Button>
        </Card.Body>
      </Card>
    </div>
  )
}
