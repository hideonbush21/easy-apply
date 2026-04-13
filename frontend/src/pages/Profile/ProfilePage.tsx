import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, getExperiences, createExperience, updateExperience, deleteExperience } from '@/api/profile'
import type { UserProfile, Experience } from '@/types'
import ExperienceModal from './ExperienceModal'
import { Plus, Pencil, Trash2, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'

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

const COUNTRIES = ['英国', '澳大利亚', '中国香港', '新加坡', '中国澳门']

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
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('基础信息')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<Partial<UserProfile>>({})
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expModal, setExpModal] = useState<{ open: boolean; experience?: Experience }>({ open: false })

  useEffect(() => {
    Promise.all([
      getProfile().then(r => {
        setProfile(r.data)
        setForm(r.data)
      }).catch(() => null),
      getExperiences().then(r => setExperiences(r.data)).catch(() => null),
    ]).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    // GPA 不能高于满分
    if (form.gpa != null && form.gpa_scale != null && form.gpa > form.gpa_scale) {
      alert(`GPA 不能高于满分（${form.gpa_scale}）`)
      return
    }
    setSaving(true)
    try {
      const res = await updateProfile(form)
      setProfile(res.data)
      setForm(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('保存失败，请稍后重试')
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

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-2" style={{ color: '#6b7280' }}>
      <Spinner /> <span className="text-sm">加载中...</span>
    </div>
  )

  return (
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>我的档案</h2>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>完善你的学术背景，获得更精准的选校推荐</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* 左侧：完整度 + 纵向 Tab 导航 */}
        <div className="shrink-0 w-64 flex flex-col gap-3">
          {/* 完整度卡片 */}
          <Card>
            <Card.Body>
              <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>档案完整度</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: '#111827' }}>{Math.round(completion)}%</span>
              </div>
              <ProgressBar value={completion} />
              {completion < 100 && (
                <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                  继续完善以获得更好的推荐效果
                </p>
              )}
            </Card.Body>
          </Card>

          {/* 纵向 Tab */}
          <Card>
            <div className="p-2">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    background: activeTab === tab.key ? '#f0fdf9' : 'transparent',
                    color: activeTab === tab.key ? '#059669' : '#6b7280',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>

          {/* 生成推荐按钮 */}
          <button
            onClick={async () => {
              if (saving) return
              setSaving(true)
              try {
                const res = await updateProfile(form)
                setProfile(res.data)
                setForm(res.data)
              } finally {
                setSaving(false)
              }
              navigate('/dashboard/schools/recommendations', { state: { autoGenerate: true } })
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 0',
              background: 'linear-gradient(135deg,#1dd3b0,#10b981)',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: '#fff',
              boxShadow: '0 4px 14px rgba(29,211,176,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(29,211,176,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(29,211,176,0.35)')}
          >
            <Sparkles size={15} />
            生成推荐
          </button>
        </div>

        {/* 右侧：表单内容 */}
        <div className="flex-1 min-w-0">
          <Card>
            <Card.Body>
              {activeTab === '基础信息' && (
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="GPA"
                    type="number"
                    step="0.01"
                    min="0"
                    max={form.gpa_scale ?? 4}
                    value={form.gpa ?? ''}
                    onChange={e => setForm(f => ({ ...f, gpa: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="3.50"
                  />
                  <Select
                    label="GPA 满分"
                    value={form.gpa_scale?.toString() ?? '4'}
                    onChange={e => setForm(f => ({ ...f, gpa_scale: Number(e.target.value) }))}
                  >
                    <option value="4">4.0</option>
                    <option value="5">5.0</option>
                    <option value="100">100</option>
                  </Select>
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
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: '#374151' }}>目标国家</label>
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
                            style={{
                              padding: '6px 18px', borderRadius: 999, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
                              background: selected ? '#1dd3b0' : '#fff',
                              color: selected ? '#fff' : '#374151',
                              border: selected ? '1.5px solid #1dd3b0' : '1.5px solid #e5e7eb',
                              fontWeight: selected ? 600 : 400,
                            }}
                          >
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: '#374151' }}>目标专业（可多选）</label>
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
                                ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-teal-400 hover:text-teal-500'
                            }`}
                          >
                            {m}
                          </button>
                        )
                      })}
                    </div>
                    {(form.target_majors || []).length > 0 && (
                      <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                        已选：{(form.target_majors || []).join('、')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === '经历' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm tabular-nums" style={{ color: '#6b7280' }}>{experiences.length} 条经历</span>
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
                    <div className="flex flex-col gap-3">
                      {experiences.map(exp => (
                        <div key={exp.id} className="border rounded-xl p-5 hover:border-teal-200 transition-colors" style={{ borderColor: '#e5e7eb' }}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="primary" size="sm">{exp.type}</Badge>
                              </div>
                              <p className="font-medium text-sm" style={{ color: '#111827' }}>{exp.title}</p>
                              {exp.organization && <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{exp.organization}</p>}
                            </div>
                            <div className="flex gap-1.5 shrink-0 ml-2">
                              <button
                                onClick={() => setExpModal({ open: true, experience: exp })}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: '#9ca3af' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#7c3aed')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleExpDelete(exp.id)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: '#9ca3af' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#e11d48')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
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
                <div className="mt-6 pt-5 border-t flex justify-end items-center gap-3" style={{ borderColor: '#f3f4f6' }}>
                  {saved && <span className="text-sm font-medium" style={{ color: '#059669' }}>已保存 ✓</span>}
                  <Button onClick={handleSave} loading={saving}>
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

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
