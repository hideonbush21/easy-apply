import { useEffect, useState } from 'react'
import { getProfile, updateProfile, getExperiences, createExperience, updateExperience, deleteExperience } from '@/api/profile'
import type { UserProfile, Experience } from '@/types'
import ExperienceModal from './ExperienceModal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Input, Select } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'

const TABS = [
  { key: '基础信息', label: '基础信息' },
  { key: '成绩', label: '成绩' },
  { key: '目标', label: '目标' },
  { key: '经历', label: '经历' },
]

const TIERS = [
  { value: 'c9', label: 'C9联盟' },
  { value: '985', label: '985高校' },
  { value: '211', label: '211高校' },
  { value: 'double_non', label: '双非院校' },
  { value: 'overseas', label: '海外院校' },
  { value: 'other', label: '其他' },
]

const DEGREE_TYPES = [
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
  { value: 'bachelor', label: '本科' },
]

const COUNTRIES = ['英国', '美国', '澳大利亚']

const MAJORS_LIST = [
  '计算机科学', '软件工程', '人工智能', '数据科学', '网络安全',
  '电子工程', '机械工程', '土木工程', '生物工程', '化学工程',
  '工商管理', '金融学', '会计学', '市场营销', '国际商务',
  '经济学', '统计学', '供应链管理', '人力资源管理', '创业管理',
  '数学', '物理学', '化学', '生物学', '环境科学',
  '地质学', '天文学', '海洋科学',
  '心理学', '社会学', '政治学', '国际关系', '传媒学',
  '新闻学', '教育学', '社会工作',
  '英语文学', '历史学', '哲学', '艺术史', '音乐',
  '电影研究', '语言学',
  '临床医学', '公共卫生', '护理学', '药学', '生物医学',
  '营养学', '运动科学',
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('基础信息')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<Partial<UserProfile>>({})
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expModal, setExpModal] = useState<{ open: boolean; experience?: Experience }>({ open: false })

  useEffect(() => {
    getProfile().then(r => {
      setProfile(r.data)
      setForm(r.data)
    })
    getExperiences().then(r => setExperiences(r.data))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateProfile(form)
      setProfile(res.data)
      setForm(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleExpSave = async (data: Omit<Experience, 'id' | 'user_id' | 'created_at'>, id?: string) => {
    if (id) {
      const res = await updateExperience(id, data)
      setExperiences(prev => prev.map(e => e.id === id ? res.data : e))
    } else {
      const res = await createExperience(data)
      setExperiences(prev => [res.data, ...prev])
    }
    setExpModal({ open: false })
  }

  const handleExpDelete = async (id: string) => {
    if (!confirm('确定删除此经历?')) return
    await deleteExperience(id)
    setExperiences(prev => prev.filter(e => e.id !== id))
  }

  const completion = profile?.completion_rate ?? 0

  return (
    <div className="p-8 max-w-3xl" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">我的档案</h2>
        <div className="flex items-center gap-3 mt-3">
          <ProgressBar value={completion} className="flex-1" />
          <span className="text-sm font-medium text-slate-500 tabular-nums shrink-0">{Math.round(completion)}% 完整</span>
        </div>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-5"
      />

      <Card>
        <Card.Body>
          {activeTab === '基础信息' && (
            <div className="space-y-4">
              <Input
                label="姓名"
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="请输入真实姓名"
              />
              <Input
                label="本科院校"
                value={form.home_institution || ''}
                onChange={e => setForm(f => ({ ...f, home_institution: e.target.value }))}
                placeholder="如：北京大学"
              />
              <Select
                label="院校层次"
                value={form.institution_tier || ''}
                onChange={e => setForm(f => ({ ...f, institution_tier: e.target.value as UserProfile['institution_tier'] }))}
              >
                <option value="">请选择</option>
                {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
              <Input
                label="本科专业"
                value={form.current_major || ''}
                onChange={e => setForm(f => ({ ...f, current_major: e.target.value }))}
                placeholder="如：计算机科学"
              />
              <Select
                label="申请学位"
                value={form.degree_type || ''}
                onChange={e => setForm(f => ({ ...f, degree_type: e.target.value as UserProfile['degree_type'] }))}
              >
                <option value="">请选择</option>
                {DEGREE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
            </div>
          )}

          {activeTab === '成绩' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  label="GPA"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.3"
                  value={form.gpa ?? ''}
                  onChange={e => setForm(f => ({ ...f, gpa: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="3.50"
                  className="flex-1"
                />
                <Input
                  label="满分"
                  type="number"
                  step="0.1"
                  value={form.gpa_scale ?? ''}
                  onChange={e => setForm(f => ({ ...f, gpa_scale: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="4.0"
                  className="flex-1"
                />
              </div>
              <Input
                label="托福成绩 (TOEFL)"
                type="number"
                value={form.language_scores?.toefl ?? ''}
                onChange={e => setForm(f => ({ ...f, language_scores: { ...f.language_scores, toefl: e.target.value ? Number(e.target.value) : undefined } }))}
                placeholder="如：108"
              />
              <Input
                label="雅思成绩 (IELTS)"
                type="number"
                step="0.5"
                value={form.language_scores?.ielts ?? ''}
                onChange={e => setForm(f => ({ ...f, language_scores: { ...f.language_scores, ielts: e.target.value ? Number(e.target.value) : undefined } }))}
                placeholder="如：7.5"
              />
            </div>
          )}

          {activeTab === '目标' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">目标国家</label>
                <div className="flex gap-3 flex-wrap">
                  {COUNTRIES.map(c => {
                    const selected = (form.target_countries || []).includes(c)
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const cur = form.target_countries || []
                          setForm(f => ({
                            ...f,
                            target_countries: selected ? cur.filter(x => x !== c) : [...cur, c]
                          }))
                        }}
                        className={`px-4 py-1.5 rounded-full text-sm border transition-all duration-150 cursor-pointer ${
                          selected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'border-slate-300 text-slate-600 hover:border-primary-400 hover:text-primary-600'
                        }`}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">目标专业（可多选）</label>
                <div className="flex flex-wrap gap-2">
                  {MAJORS_LIST.map(m => {
                    const selected = (form.target_majors || []).includes(m)
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          const cur = form.target_majors || []
                          setForm(f => ({
                            ...f,
                            target_majors: selected ? cur.filter(x => x !== m) : [...cur, m]
                          }))
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-all duration-150 cursor-pointer ${
                          selected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:border-primary-400 hover:text-primary-600'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
                {(form.target_majors || []).length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    已选：{(form.target_majors || []).join('、')}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === '经历' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-500 tabular-nums">{experiences.length} 条经历</span>
                <Button size="sm" onClick={() => setExpModal({ open: true })}>
                  <Plus size={14} /> 添加经历
                </Button>
              </div>
              {experiences.length === 0 ? (
                <EmptyState
                  icon={<Plus size={18} />}
                  title="暂无经历"
                  description="点击上方按钮添加实习、科研等经历"
                />
              ) : (
                <div className="space-y-3">
                  {experiences.map(exp => (
                    <div key={exp.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="primary" size="sm">{exp.type}</Badge>
                            <span className="font-medium text-slate-900 text-sm">{exp.title}</span>
                          </div>
                          {exp.organization && <p className="text-xs text-slate-400">{exp.organization}</p>}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setExpModal({ open: true, experience: exp })}
                            className="p-1.5 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleExpDelete(exp.id)}
                            className="p-1.5 text-slate-300 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab !== '经历' && (
            <div className="mt-6 flex items-center gap-3 pt-5 border-t border-slate-100">
              <Button onClick={handleSave} loading={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
              {saved && <span className="text-sm text-success-600 font-medium">已保存 ✓</span>}
            </div>
          )}
        </Card.Body>
      </Card>

      {expModal.open && (
        <ExperienceModal
          experience={expModal.experience}
          onSave={handleExpSave}
          onClose={() => setExpModal({ open: false })}
        />
      )}
    </div>
  )
}
