import { useEffect, useState } from 'react'
import { getProfile, updateProfile, getExperiences, createExperience, updateExperience, deleteExperience } from '@/api/profile'
import type { UserProfile, Experience } from '@/types'
import ExperienceModal from './ExperienceModal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const TABS = ['基础信息', '成绩', '目标', '经历'] as const
type Tab = typeof TABS[number]

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

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('基础信息')
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
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">我的档案</h2>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${completion}%` }} />
          </div>
          <span className="text-sm text-gray-500">{Math.round(completion)}% 完整</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === '基础信息' && (
          <div className="space-y-4">
            <Field label="姓名">
              <input className={inputCls} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="请输入真实姓名" />
            </Field>
            <Field label="本科院校">
              <input className={inputCls} value={form.home_institution || ''} onChange={e => setForm(f => ({ ...f, home_institution: e.target.value }))} placeholder="如：北京大学" />
            </Field>
            <Field label="院校层次">
              <select className={inputCls} value={form.institution_tier || ''} onChange={e => setForm(f => ({ ...f, institution_tier: e.target.value as UserProfile['institution_tier'] }))}>
                <option value="">请选择</option>
                {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="本科专业">
              <input className={inputCls} value={form.current_major || ''} onChange={e => setForm(f => ({ ...f, current_major: e.target.value }))} placeholder="如：计算机科学" />
            </Field>
            <Field label="申请学位">
              <select className={inputCls} value={form.degree_type || ''} onChange={e => setForm(f => ({ ...f, degree_type: e.target.value as UserProfile['degree_type'] }))}>
                <option value="">请选择</option>
                {DEGREE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
          </div>
        )}

        {activeTab === '成绩' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Field label="GPA" className="flex-1">
                <input
                  className={inputCls}
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.3"
                  value={form.gpa ?? ''}
                  onChange={e => setForm(f => ({ ...f, gpa: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="3.50"
                />
              </Field>
              <Field label="满分" className="flex-1">
                <input
                  className={inputCls}
                  type="number"
                  step="0.1"
                  value={form.gpa_scale ?? ''}
                  onChange={e => setForm(f => ({ ...f, gpa_scale: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="4.0"
                />
              </Field>
            </div>
            <Field label="托福成绩 (TOEFL)">
              <input
                className={inputCls}
                type="number"
                value={form.language_scores?.toefl ?? ''}
                onChange={e => setForm(f => ({ ...f, language_scores: { ...f.language_scores, toefl: e.target.value ? Number(e.target.value) : undefined } }))}
                placeholder="如：108"
              />
            </Field>
            <Field label="雅思成绩 (IELTS)">
              <input
                className={inputCls}
                type="number"
                step="0.5"
                value={form.language_scores?.ielts ?? ''}
                onChange={e => setForm(f => ({ ...f, language_scores: { ...f.language_scores, ielts: e.target.value ? Number(e.target.value) : undefined } }))}
                placeholder="如：7.5"
              />
            </Field>
          </div>
        )}

        {activeTab === '目标' && (
          <div className="space-y-4">
            <Field label="目标国家 (逗号分隔)">
              <input
                className={inputCls}
                value={(form.target_countries || []).join('、')}
                onChange={e => setForm(f => ({ ...f, target_countries: e.target.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean) }))}
                placeholder="如：英国、美国、澳大利亚"
              />
            </Field>
            <Field label="目标专业 (逗号分隔)">
              <input
                className={inputCls}
                value={(form.target_majors || []).join('、')}
                onChange={e => setForm(f => ({ ...f, target_majors: e.target.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean) }))}
                placeholder="如：计算机科学、人工智能"
              />
            </Field>
          </div>
        )}

        {activeTab === '经历' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">{experiences.length} 条经历</span>
              <button
                onClick={() => setExpModal({ open: true })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} /> 添加经历
              </button>
            </div>
            {experiences.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">暂无经历，点击上方按钮添加</p>
            ) : (
              <div className="space-y-3">
                {experiences.map(exp => (
                  <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded mr-2">{exp.type}</span>
                        <span className="font-medium text-gray-900 text-sm">{exp.title}</span>
                        {exp.organization && <p className="text-xs text-gray-500 mt-1">{exp.organization}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setExpModal({ open: true, experience: exp })} className="text-gray-400 hover:text-blue-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleExpDelete(exp.id)} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={15} />
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
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {saved && <span className="text-sm text-green-600">已保存</span>}
          </div>
        )}
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

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
